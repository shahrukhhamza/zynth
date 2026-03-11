"""
economic_calendar.py — Main entry point for the US Economic Calendar CLI.

Usage:
  python economic_calendar.py                     # Normal run (uses cache if fresh)
  python economic_calendar.py --force-refresh      # Clear cache + re-fetch everything
  python economic_calendar.py --analysis           # Append Gemini market analysis
  python economic_calendar.py --save               # Save output to output/ directory
  python economic_calendar.py --save --analysis    # Both
  python economic_calendar.py --no-gemini          # Skip ALL Gemini calls

Data flow:
  BLSFetcher  ──┐
                ├──► CrossValidator ──► TerminalUI
  FREDFetcher ──┘         │
                          ▼
                  GeminiReasoner  (only for discrepancies or --analysis)
                          │
                  TEFetcher  (optional forecasts, if key set)
"""

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

# ---- project imports ---------------------------------------------------------
from config import OUTPUT_DIR, LOG_DIR, APP_VERSION, FRED_API_KEY, GEMINI_API_KEY
from cache import clear_all as clear_cache
from data_fetcher import BLSFetcher, FREDFetcher, TEFetcher
from validator import validate_and_merge, get_flagged
from gemini_reasoning import investigate_discrepancy, generate_market_analysis
from terminal_ui import render

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.WARNING,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "economic_calendar.log", encoding="utf-8"),
        logging.StreamHandler(sys.stderr),
    ],
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="economic_calendar",
        description=(
            f"US Economic Calendar v{APP_VERSION}  —  "
            "Real-time data from BLS + FRED.  Gemini used only for reasoning."
        ),
    )
    parser.add_argument(
        "--force-refresh", "-f",
        action="store_true",
        help="Ignore cache and re-fetch all data from APIs.",
    )
    parser.add_argument(
        "--analysis", "-a",
        action="store_true",
        help="Append a Gemini-generated market analysis (requires GEMINI_API_KEY).",
    )
    parser.add_argument(
        "--save", "-s",
        action="store_true",
        help="Save output to output/calendar_YYYYMMDD_HHMM.json and .txt.",
    )
    parser.add_argument(
        "--no-gemini",
        action="store_true",
        help="Disable all Gemini calls (discrepancy investigation + analysis).",
    )
    parser.add_argument(
        "--version", "-v",
        action="version",
        version=f"%(prog)s {APP_VERSION}",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Core orchestration
# ---------------------------------------------------------------------------

def _warn(msg: str):
    """Print a visible warning to stderr without crashing."""
    print(f"\n[WARNING] {msg}", file=sys.stderr)


def run(args: argparse.Namespace):
    # ---- 0. Optionally clear cache ------------------------------------------
    if args.force_refresh:
        cleared = clear_cache()
        print(f"Cache cleared ({cleared} entries removed).\n")

    # ---- 1. Pre-flight checks -----------------------------------------------
    if not FRED_API_KEY:
        _warn(
            "FRED_API_KEY is not set in .env  "
            "→  Fed Rate and Retail Sales will be unavailable.\n"
            "   Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html"
        )

    if args.analysis and not GEMINI_API_KEY and not args.no_gemini:
        _warn(
            "GEMINI_API_KEY is not set in .env  "
            "→  --analysis will be skipped.\n"
            "   Add your Gemini key to use AI market analysis."
        )

    # ---- 2. Fetch from official APIs ----------------------------------------
    print("Fetching data from BLS + FRED …", end=" ", flush=True)

    bls  = BLSFetcher()
    fred = FREDFetcher()
    te   = TEFetcher()

    bls_cpi         = bls.get_cpi()
    bls_ppi         = bls.get_ppi()
    bls_unemployment = bls.get_unemployment()

    fred_cpi          = fred.get_cpi()
    fred_ppi          = fred.get_ppi()
    fred_unemployment = fred.get_unemployment()
    fred_fed_rate     = fred.get_fed_rate()
    fred_retail       = fred.get_retail_sales()

    print("done.")

    # ---- 3. Fetch forecasts (optional) --------------------------------------
    print("Fetching analyst forecasts (Trading Economics) …", end=" ", flush=True)
    forecasts = te.get_forecasts()
    status_msg = "done." if te.available else "skipped (no key)."
    print(status_msg)

    # ---- 4. Cross-source validation -----------------------------------------
    records = validate_and_merge(
        bls_cpi           = bls_cpi,
        fred_cpi          = fred_cpi,
        bls_ppi           = bls_ppi,
        fred_ppi          = fred_ppi,
        bls_unemployment  = bls_unemployment,
        fred_unemployment = fred_unemployment,
        fred_fed_rate     = fred_fed_rate,
        fred_retail       = fred_retail,
        forecasts         = forecasts,
    )

    # ---- 5. Gemini discrepancy investigation ---------------------------------
    flagged = get_flagged(records)
    if flagged and not args.no_gemini and GEMINI_API_KEY:
        print(f"Investigating {len(flagged)} discrepancy(s) with Gemini …")
        for rec in flagged:
            note = investigate_discrepancy(rec)
            if note:
                rec["gemini_note"] = note

    # ---- 6. Optional Gemini market analysis ---------------------------------
    analysis: str | None = None
    if args.analysis and not args.no_gemini and GEMINI_API_KEY:
        print("Generating Gemini market analysis …", end=" ", flush=True)
        analysis = generate_market_analysis(records)
        print("done.")

    # ---- 7. Render to terminal -----------------------------------------------
    save_txt_path = None
    if args.save:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        save_txt_path = str(OUTPUT_DIR / f"calendar_{ts}.txt")

    print()  # blank line before table
    render(records, analysis=analysis, save_path=save_txt_path)

    # ---- 8. Optionally save JSON --------------------------------------------
    if args.save:
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        json_path = OUTPUT_DIR / f"calendar_{ts}.json"
        payload = {
            "generated_at": datetime.now().isoformat(),
            "version":      APP_VERSION,
            "indicators":   records,
            "analysis":     analysis,
        }
        with open(json_path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, default=str)
        print(f"JSON saved: {json_path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    args = _parse_args()
    try:
        run(args)
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        sys.exit(0)
    except Exception as exc:
        logger.exception("Unexpected error: %s", exc)
        print(f"\nFatal error: {exc}", file=sys.stderr)
        sys.exit(1)
