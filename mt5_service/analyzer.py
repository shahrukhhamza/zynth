"""
Trade performance analysis using pandas.
Calculates all key statistics from a list of trade dicts.
"""

from __future__ import annotations

from typing import Any, Dict, List


def _fmt_duration(seconds: float) -> str:
    seconds = max(0, seconds)
    if seconds < 60:
        return f"{int(seconds)}s"
    if seconds < 3600:
        return f"{int(seconds / 60)}m"
    if seconds < 86400:
        h = int(seconds / 3600)
        m = int((seconds % 3600) / 60)
        return f"{h}h {m}m"
    d = int(seconds / 86400)
    h = int((seconds % 86400) / 3600)
    return f"{d}d {h}h"


def _session_of(hour: int) -> str:
    if 0 <= hour < 8:
        return "Asian"
    if 8 <= hour < 13:
        return "London"
    if 13 <= hour < 18:
        return "New York"
    return "Evening"


def analyze_trades(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Return a comprehensive statistics dict derived from *trades*.
    All monetary values are rounded to 2 d.p.
    """
    if not trades:
        return {}

    import pandas as pd  # deferred — not needed at import time

    df = pd.DataFrame(trades)

    total_trades = len(df)
    winners = df[df["profit"] > 0]
    losers = df[df["profit"] < 0]
    win_count = len(winners)
    loss_count = len(losers)

    win_rate = round(win_count / total_trades * 100, 2)
    loss_rate = round(loss_count / total_trades * 100, 2)

    total_profit = round(float(df["profit"].sum()), 2)
    gross_profit = round(float(winners["profit"].sum()), 2) if not winners.empty else 0.0
    gross_loss = round(abs(float(losers["profit"].sum())), 2) if not losers.empty else 0.0

    profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else None

    avg_win = round(float(winners["profit"].mean()), 2) if not winners.empty else 0.0
    avg_loss = round(abs(float(losers["profit"].mean())), 2) if not losers.empty else 0.0
    avg_rr = round(avg_win / avg_loss, 2) if avg_loss > 0 else None

    total_swap = round(float(df["swap"].sum()), 2) if "swap" in df.columns else 0.0
    total_commission = (
        round(float(df["commission"].sum()), 2) if "commission" in df.columns else 0.0
    )

    # ── Per-symbol breakdown ───────────────────────────────────────────────
    symbol_stats: Dict[str, Any] = {}
    for sym, grp in df.groupby("symbol"):
        sym_wins = len(grp[grp["profit"] > 0])
        sym_total = len(grp)
        symbol_stats[str(sym)] = {
            "total_trades": sym_total,
            "profit": round(float(grp["profit"].sum()), 2),
            "win_rate": round(sym_wins / sym_total * 100, 2) if sym_total else 0.0,
        }

    best_symbol = (
        max(symbol_stats, key=lambda s: symbol_stats[s]["profit"]) if symbol_stats else None
    )
    worst_symbol = (
        min(symbol_stats, key=lambda s: symbol_stats[s]["profit"]) if symbol_stats else None
    )

    # ── Session breakdown ──────────────────────────────────────────────────
    df["_close_dt"] = pd.to_datetime(df["close_time"], utc=True)
    df["_session"] = df["_close_dt"].dt.hour.apply(_session_of)
    session_profit: Dict[str, float] = {
        k: round(float(v), 2)
        for k, v in df.groupby("_session")["profit"].sum().items()
    }
    best_session = max(session_profit, key=session_profit.get) if session_profit else None

    # ── Consecutive losses ─────────────────────────────────────────────────
    profits_ordered = (
        df.sort_values("_close_dt")["profit"].tolist()
    )
    max_consec_losses = cur = 0
    for p in profits_ordered:
        if p < 0:
            cur += 1
            max_consec_losses = max(max_consec_losses, cur)
        else:
            cur = 0

    # ── Average duration ───────────────────────────────────────────────────
    avg_duration = (
        _fmt_duration(float(df["duration_seconds"].mean()))
        if "duration_seconds" in df.columns
        else "N/A"
    )

    # ── Monthly profit series (for charts) ────────────────────────────────
    df["_month"] = df["_close_dt"].dt.to_period("M").astype(str)
    monthly_profit = {
        k: round(float(v), 2)
        for k, v in df.groupby("_month")["profit"].sum().items()
    }

    return {
        "total_trades": total_trades,
        "win_count": win_count,
        "loss_count": loss_count,
        "win_rate": win_rate,
        "loss_rate": loss_rate,
        "total_profit": total_profit,
        "gross_profit": gross_profit,
        "gross_loss": gross_loss,
        "profit_factor": profit_factor,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "avg_risk_reward": avg_rr,
        "total_swap": total_swap,
        "total_commission": total_commission,
        "best_symbol": best_symbol,
        "worst_symbol": worst_symbol,
        "symbol_stats": symbol_stats,
        "session_profit": session_profit,
        "best_session": best_session,
        "max_consecutive_losses": max_consec_losses,
        "avg_trade_duration": avg_duration,
        "monthly_profit": monthly_profit,
    }
