"""
MT5 Trade Sync
==============
Polls MetaTrader 5 every 60 seconds for deals closed in the last 24 hours and
POSTs any unseen trades to the Zynth web API.

Requirements
------------
    pip install MetaTrader5 requests python-dotenv

Environment variables (via .env or OS)
---------------------------------------
    MT5_LOGIN      — account number (integer)
    MT5_PASSWORD   — INVESTOR (read-only) password
    MT5_SERVER     — broker server name, e.g. "ICMarkets-Demo"
    API_SECRET     — bearer token for the Zynth API
"""

import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import MetaTrader5 as mt5
import requests
from dotenv import load_dotenv

# ── Load environment ────────────────────────────────────────────────────────────
load_dotenv()

MT5_LOGIN    = int(os.getenv("MT5_LOGIN", 0))
MT5_PASSWORD = os.getenv("MT5_PASSWORD", "")
MT5_SERVER   = os.getenv("MT5_SERVER", "")

# ── API auth ─────────────────────────────────────────────────────────────────────
SYNC_API_SECRET = "Zynth_Alpha_770"
# Your Zynth user_id — find it in Railway DB → users table, or via /api/auth/me
ZYNTH_USER_ID   = int(os.getenv("ZYNTH_USER_ID", 1))
SYNC_URL            = "https://ai-dashboard-production-c844.up.railway.app/api/sync"
SYNC_INTERVAL_SEC   = 60
LOOKBACK_HOURS      = 24
SYNCED_TICKETS_FILE = Path(__file__).parent / "synced.txt"
LOG_FILE            = Path(__file__).parent / "mt5_sync.log"

# ── Logging ─────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


# ── Config validation ────────────────────────────────────────────────────────────
def validate_config() -> None:
    """Raise early if any required environment variable is missing or empty."""
    required = {
        "MT5_LOGIN":    MT5_LOGIN,
        "MT5_PASSWORD": MT5_PASSWORD,
        "MT5_SERVER":   MT5_SERVER,
    }
    missing = [k for k, v in required.items() if not v]
    if missing:
        raise EnvironmentError(
            f"Missing required environment variable(s): {', '.join(missing)}\n"
            "Ensure your .env file or OS environment is configured correctly."
        )


# ── MT5 connection ───────────────────────────────────────────────────────────────
def connect_mt5() -> bool:
    """
    Initialize the MT5 terminal and authenticate with the INVESTOR
    (read-only) password.  Returns True on success.
    """
    if not mt5.initialize():
        log.error("mt5.initialize() failed — %s", mt5.last_error())
        return False

    authorized = mt5.login(
        login=MT5_LOGIN,
        password=MT5_PASSWORD,   # pass your INVESTOR password here
        server=MT5_SERVER,
    )
    if not authorized:
        log.error("mt5.login() failed — %s", mt5.last_error())
        mt5.shutdown()
        return False

    info = mt5.account_info()
    log.info(
        "MT5 connected — account #%s  |  server: %s  |  currency: %s",
        info.login, info.server, info.currency,
    )
    return True


# ── Ticket persistence ───────────────────────────────────────────────────────────
def load_synced_tickets() -> set:
    """Return the set of deal ticket IDs that have already been uploaded."""
    if not SYNCED_TICKETS_FILE.exists():
        return set()
    with SYNCED_TICKETS_FILE.open(encoding="utf-8") as fh:
        tickets = set()
        for line in fh:
            stripped = line.strip()
            if stripped.isdigit():
                tickets.add(int(stripped))
    return tickets


def save_synced_tickets(tickets: set) -> None:
    """Overwrite the tracking file with the current complete set of ticket IDs."""
    with SYNCED_TICKETS_FILE.open("w", encoding="utf-8") as fh:
        for ticket in sorted(tickets):
            fh.write(f"{ticket}\n")


# ── Deal fetching ────────────────────────────────────────────────────────────────
def fetch_exit_deals() -> list:
    """
    Return all EXIT deals (completed trades with P&L) from the last
    LOOKBACK_HOURS hours, sorted oldest-first.
    """
    utc_now  = datetime.now(timezone.utc)
    utc_from = utc_now - timedelta(hours=LOOKBACK_HOURS)

    deals = mt5.history_deals_get(utc_from, utc_now)
    if deals is None:
        log.warning("history_deals_get returned None — %s", mt5.last_error())
        return []

    # DEAL_ENTRY_OUT = 1  (position-closing deals carrying realised P&L)
    exit_deals = [
        d for d in deals
        if d.entry == mt5.DEAL_ENTRY_OUT and d.profit != 0.0
    ]
    exit_deals.sort(key=lambda d: d.time)
    return exit_deals


def get_entry_time_for_position(position_id: int) -> Optional[datetime]:
    """
    Look up the opening (DEAL_ENTRY_IN) deal for the given position and
    return its UTC timestamp, or None if not found.
    """
    # Search a generous window to find the originating deal
    utc_now   = datetime.now(timezone.utc)
    utc_from  = utc_now - timedelta(days=365)
    all_deals = mt5.history_deals_get(utc_from, utc_now)
    if not all_deals:
        return None

    for d in all_deals:
        if d.position_id == position_id and d.entry == mt5.DEAL_ENTRY_IN:
            return datetime.fromtimestamp(d.time, tz=timezone.utc)
    return None


# ── Payload formatting ───────────────────────────────────────────────────────────
def format_deal(deal) -> dict:
    """
    Convert an MT5 TradeDeal (exit side) into the Zynth API payload schema.
    entry_time is resolved via the position's opening deal when available.
    """
    exit_time_dt  = datetime.fromtimestamp(deal.time, tz=timezone.utc)
    entry_time_dt = get_entry_time_for_position(deal.position_id) or exit_time_dt

    return {
        "ticket": deal.ticket,
        "symbol": deal.symbol,
        "volume": round(float(deal.volume), 5),
        "profit": round(float(deal.profit), 2),
        "time":   exit_time_dt.isoformat(),
        "type":   int(deal.type),
        # legacy fields kept for backward-compat
        "ticket_id":  deal.ticket,
        "entry_time": entry_time_dt.isoformat(),
        "exit_time":  exit_time_dt.isoformat(),
    }


# ── API transmission ─────────────────────────────────────────────────────────────
def post_trades(payload: list) -> bool:
    """
    POST the list of formatted trade dicts to the Zynth sync endpoint.
    Returns True when the server responds with 2xx.
    Prints full status + body so auth failures are easy to debug.
    """
    body = json.dumps({"user_id": ZYNTH_USER_ID, "trades": payload})
    try:
        response = requests.post(
            SYNC_URL,
            data=body,
            headers={
                "Authorization": SYNC_API_SECRET,
                "Content-Type":  "application/json",
            },
            timeout=15,
        )

        # ── Always print status + body for easy debugging ─────────────────
        print(f"[POST] {SYNC_URL}")
        print(f"  Status : {response.status_code} {response.reason}")
        print(f"  Body   : {response.text[:500]}")
        log.info("POST %s → HTTP %s", SYNC_URL, response.status_code)

        if response.ok:
            log.info(
                "Sync successful — %d trade(s) accepted  (HTTP %s)",
                len(payload), response.status_code,
            )
            return True

        log.error(
            "API rejected payload — HTTP %s: %s",
            response.status_code,
            response.text[:300],
        )
        return False

    except requests.Timeout:
        log.error("POST request to %s timed out after 15 s", SYNC_URL)
        print(f"[ERROR] Request timed out after 15 s")
    except requests.ConnectionError as exc:
        log.error("Connection error while posting trades: %s", exc)
        print(f"[ERROR] Connection error: {exc}")
    except requests.RequestException as exc:
        log.error("Unexpected HTTP error: %s", exc)
        print(f"[ERROR] Request exception: {exc}")

    return False


# ── Sync cycle ───────────────────────────────────────────────────────────────────
def sync_cycle(synced: set) -> None:
    """
    One full iteration:
      1. Fetch exit deals from the last 24 h
      2. Filter out already-synced tickets
      3. Format and POST new deals
      4. Persist newly synced ticket IDs
    """
    deals = fetch_exit_deals()
    new_deals = [d for d in deals if d.ticket not in synced]

    if not new_deals:
        log.debug("No new deals to sync.")
        return

    log.info("Found %d new deal(s) — building payload…", len(new_deals))
    payload = [format_deal(d) for d in new_deals]

    if post_trades(payload):
        for d in new_deals:
            synced.add(d.ticket)
        save_synced_tickets(synced)
        log.info(
            "Tracking file updated — %d total synced ticket(s).",
            len(synced),
        )
    else:
        log.warning(
            "%d deal(s) were NOT synced this cycle and will be retried.",
            len(new_deals),
        )


# ── Entry point ──────────────────────────────────────────────────────────────────
def main() -> None:
    validate_config()

    log.info(
        "MT5 Trade Sync starting — interval: %ds  |  lookback: %dh  |  log: %s",
        SYNC_INTERVAL_SEC, LOOKBACK_HOURS, LOG_FILE,
    )

    if not connect_mt5():
        raise RuntimeError(
            "Could not connect to MT5. Verify MT5_LOGIN, MT5_PASSWORD, and "
            "MT5_SERVER in your .env file, and ensure the MT5 terminal is running."
        )

    synced = load_synced_tickets()
    log.info("Loaded %d previously synced ticket(s) from %s", len(synced), SYNCED_TICKETS_FILE)

    try:
        while True:
            try:
                sync_cycle(synced)
            except Exception as exc:
                # Log but don't crash — retry on the next cycle
                log.exception("Unhandled error in sync cycle: %s", exc)

            log.debug("Sleeping %d s until next cycle…", SYNC_INTERVAL_SEC)
            time.sleep(SYNC_INTERVAL_SEC)

    except KeyboardInterrupt:
        log.info("Shutdown requested (KeyboardInterrupt) — stopping gracefully.")
    finally:
        mt5.shutdown()
        log.info("MT5 connection closed. Bye.")


if __name__ == "__main__":
    main()
