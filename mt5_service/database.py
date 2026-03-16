"""
SQLite database layer for MT5 trade storage.
Supports both direct MT5 imports and journal file uploads.
"""

import sqlite3
from pathlib import Path
from typing import List, Dict, Any, Optional

DB_PATH = Path(__file__).parent / "data" / "trades.db"

# Columns added after initial release — migrated at startup
_MIGRATION_COLUMNS = [
    ("lot",          "REAL"),
    ("stop_loss",    "REAL"),
    ("take_profit",  "REAL"),
    ("source",       "TEXT DEFAULT 'mt5'"),
    ("upload_batch", "TEXT"),
]


def init_db() -> None:
    """Create the trades table and apply pending column migrations."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trades (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id          TEXT    NOT NULL DEFAULT 'default',
            ticket           INTEGER,
            symbol           TEXT,
            type             TEXT,
            volume           REAL,
            lot              REAL,
            open_price       REAL,
            close_price      REAL,
            stop_loss        REAL,
            take_profit      REAL,
            profit           REAL,
            swap             REAL,
            commission       REAL,
            open_time        TEXT,
            close_time       TEXT,
            duration         TEXT,
            duration_seconds REAL,
            source           TEXT DEFAULT 'mt5',
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Non-destructive migration: add any missing columns to existing tables
    cursor.execute("PRAGMA table_info(trades)")
    existing_cols = {row[1] for row in cursor.fetchall()}
    for col_name, col_def in _MIGRATION_COLUMNS:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE trades ADD COLUMN {col_name} {col_def}")

    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades (user_id)"
    )
    conn.commit()
    conn.close()


def save_trades(
    trades: List[Dict[str, Any]],
    user_id: str = "default",
    source: str = "mt5",
) -> None:
    """
    Replace all existing trades for *user_id* + *source* with the new list.
    Transaction is atomic.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN")
        cursor.execute(
            "DELETE FROM trades WHERE user_id = ? AND source = ?",
            (user_id, source),
        )
        cursor.executemany(
            """
            INSERT INTO trades
                (user_id, ticket, symbol, type, volume, lot,
                 open_price, close_price, stop_loss, take_profit,
                 profit, swap, commission,
                 open_time, close_time, duration, duration_seconds, source)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            [
                (
                    user_id,
                    t.get("ticket"),
                    t.get("symbol"),
                    t.get("type"),
                    t.get("volume"),
                    t.get("lot") or t.get("volume"),   # journal uses "lot"
                    t.get("open_price"),
                    t.get("close_price"),
                    t.get("stop_loss"),
                    t.get("take_profit"),
                    t.get("profit"),
                    t.get("swap"),
                    t.get("commission"),
                    t.get("open_time"),
                    t.get("close_time"),
                    t.get("duration"),
                    t.get("duration_seconds"),
                    source,
                )
                for t in trades
            ],
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _trade_fingerprint(t: Dict[str, Any]) -> str:
    """
    Stable fingerprint for deduplication.
    Based on: symbol + type + lot + open_price + close_price + profit + close_time.
    Two trades are considered identical if ALL fields match (±0.001 tolerance
    on floats to handle rounding differences between screenshots).
    """
    import hashlib

    def _norm_num(v):
        try:
            return round(float(v), 3)
        except (TypeError, ValueError):
            return 0.0

    def _norm_str(v):
        return str(v or "").strip().lower()

    key = (
        f"{_norm_str(t.get('symbol'))}"
        f"|{_norm_str(t.get('type'))}"
        f"|{_norm_num(t.get('lot') or t.get('volume'))}"
        f"|{_norm_num(t.get('open_price'))}"
        f"|{_norm_num(t.get('close_price'))}"
        f"|{_norm_num(t.get('profit'))}"
        f"|{_norm_str(t.get('close_time'))}"
    )
    return hashlib.md5(key.encode()).hexdigest()


def _trade_relaxed_fingerprint(t: Dict[str, Any]) -> Optional[str]:
    """
    Fallback screenshot dedupe key.
    If OCR/Gemini slightly changes prices, we still treat the trade as the same
    when symbol, side, lot, profit, and close timestamp all match.
    """
    import hashlib

    def _norm_num(v):
        try:
            return round(float(v), 3)
        except (TypeError, ValueError):
            return None

    def _norm_str(v):
        return str(v or "").strip().lower()

    lot = _norm_num(t.get("lot") or t.get("volume"))
    profit = _norm_num(t.get("profit"))
    close_time = _norm_str(t.get("close_time"))
    symbol = _norm_str(t.get("symbol"))
    trade_type = _norm_str(t.get("type"))

    if lot is None or profit is None or not close_time or not symbol or not trade_type:
        return None

    key = f"{symbol}|{trade_type}|{lot}|{profit}|{close_time}"
    return hashlib.md5(key.encode()).hexdigest()


def merge_screenshot_trades(
    new_trades: List[Dict[str, Any]],
    user_id: str = "default",
    upload_batch: Optional[str] = None,
) -> Dict[str, int]:
    """
    Append-only merge for screenshot imports.
    Compares incoming trades against ALL already-stored screenshot trades
    for this user using a fingerprint.  Only genuinely new trades are
    inserted — duplicates are silently dropped.

    Returns {"inserted": N, "duplicates": M} so the API can report back.
    """
    existing = get_trades(user_id=user_id, source="screenshot")
    existing_fps = {_trade_fingerprint(t) for t in existing}
    existing_relaxed_fps = {
        fp for fp in (_trade_relaxed_fingerprint(t) for t in existing) if fp
    }

    to_insert = []
    dupes = 0
    for t in new_trades:
        fp = _trade_fingerprint(t)
        relaxed_fp = _trade_relaxed_fingerprint(t)
        if fp in existing_fps or (relaxed_fp is not None and relaxed_fp in existing_relaxed_fps):
            dupes += 1
        else:
            existing_fps.add(fp)   # prevent dupes within the same upload
            if relaxed_fp is not None:
                existing_relaxed_fps.add(relaxed_fp)
            to_insert.append(t)

    if not to_insert:
        return {"inserted": 0, "duplicates": dupes}

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN")
        cursor.executemany(
            """
            INSERT INTO trades
                 (user_id, ticket, symbol, type, volume, lot,
                  open_price, close_price, stop_loss, take_profit,
                  profit, swap, commission,
                  open_time, close_time, duration, duration_seconds, source, upload_batch)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            [
                (
                    user_id,
                    t.get("ticket"),
                    t.get("symbol"),
                    t.get("type"),
                    t.get("volume"),
                    t.get("lot") or t.get("volume"),
                    t.get("open_price"),
                    t.get("close_price"),
                    t.get("stop_loss"),
                    t.get("take_profit"),
                    t.get("profit"),
                    t.get("swap"),
                    t.get("commission"),
                    t.get("open_time"),
                    t.get("close_time"),
                    t.get("duration"),
                    t.get("duration_seconds"),
                    "screenshot",
                    upload_batch,
                )
                for t in to_insert
            ],
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return {"inserted": len(to_insert), "duplicates": dupes}


def cleanup_duplicate_screenshot_trades(user_id: str = "default") -> int:
    """Delete already-stored duplicate screenshot trades for the user."""
    if not DB_PATH.exists():
        return 0

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT *
        FROM trades
        WHERE user_id = ? AND source = 'screenshot'
        ORDER BY id ASC
        """,
        (user_id,),
    )
    rows = [dict(row) for row in cursor.fetchall()]

    exact_seen = set()
    relaxed_seen = set()
    duplicate_ids = []

    for trade in rows:
        exact_fp = _trade_fingerprint(trade)
        relaxed_fp = _trade_relaxed_fingerprint(trade)
        if exact_fp in exact_seen or (relaxed_fp is not None and relaxed_fp in relaxed_seen):
            duplicate_ids.append(trade["id"])
            continue

        exact_seen.add(exact_fp)
        if relaxed_fp is not None:
            relaxed_seen.add(relaxed_fp)

    if not duplicate_ids:
        conn.close()
        return 0

    cursor.executemany("DELETE FROM trades WHERE id = ?", [(trade_id,) for trade_id in duplicate_ids])
    conn.commit()
    conn.close()
    return len(duplicate_ids)


def get_screenshot_batches(user_id: str = "default") -> List[Dict[str, Any]]:
    """Return upload sessions (batches) for the user, ordered oldest first."""
    if not DB_PATH.exists():
        return []

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            upload_batch,
            COUNT(*)                      AS trade_count,
            MIN(created_at)               AS uploaded_at,
            GROUP_CONCAT(DISTINCT symbol) AS symbols
        FROM trades
        WHERE user_id = ? AND source = 'screenshot'
        GROUP BY upload_batch
        ORDER BY MIN(created_at) ASC
        """,
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_trades_by_batch(user_id: str, batch_id: Optional[str]) -> int:
    """Delete all screenshot trades for a specific upload batch (None = legacy trades)."""
    if not DB_PATH.exists():
        return 0

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if batch_id is None:
        cursor.execute(
            "DELETE FROM trades WHERE user_id = ? AND source = 'screenshot' AND upload_batch IS NULL",
            (user_id,),
        )
    else:
        cursor.execute(
            "DELETE FROM trades WHERE user_id = ? AND source = 'screenshot' AND upload_batch = ?",
            (user_id, batch_id),
        )
    deleted = cursor.rowcount or 0
    conn.commit()
    conn.close()
    return deleted


def get_trades(
    user_id: str = "default",
    source: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Return all trades for *user_id* (optionally filtered by *source*)."""
    if not DB_PATH.exists():
        return []

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if source:
        cursor.execute(
            "SELECT * FROM trades WHERE user_id = ? AND source = ? ORDER BY close_time DESC",
            (user_id, source),
        )
    else:
        cursor.execute(
            "SELECT * FROM trades WHERE user_id = ? ORDER BY close_time DESC",
            (user_id,),
        )

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_trade_by_id(trade_id: int, user_id: str = "default") -> bool:
    """Delete a single trade by its primary key, scoped to user_id. Returns True if deleted."""
    if not DB_PATH.exists():
        return False

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM trades WHERE id = ? AND user_id = ?",
        (trade_id, user_id),
    )
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def delete_trades(
    user_id: str = "default",
    source: Optional[str] = None,
) -> int:
    """Delete trades for *user_id* (optionally filtered by *source*). Returns deleted row count."""
    if not DB_PATH.exists():
        return 0

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if source:
        cursor.execute(
            "DELETE FROM trades WHERE user_id = ? AND source = ?",
            (user_id, source),
        )
    else:
        cursor.execute(
            "DELETE FROM trades WHERE user_id = ?",
            (user_id,),
        )

    deleted = cursor.rowcount or 0
    conn.commit()
    conn.close()
    return deleted

