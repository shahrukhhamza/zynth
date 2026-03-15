"""
Extended trade analytics for journal imports.

Covers:
  - General performance statistics
  - Per-symbol / per-session / per-hour breakdown
  - Heatmap data (day × hour)
  - Behavioral pattern detection
  - AI report (Gemini or deterministic rule engine)
"""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from typing import Any, Dict, List, Optional

_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday",
              "Friday", "Saturday", "Sunday"]


def _pyval(obj: Any) -> Any:
    """Recursively convert numpy/pandas scalars to native Python types so
    FastAPI/pydantic can serialise them without errors."""
    import numpy as np
    if isinstance(obj, dict):
        return {k: _pyval(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_pyval(v) for v in obj]
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return [_pyval(v) for v in obj.tolist()]
    # pandas NA / NaT / NaN
    try:
        import pandas as pd
        if obj is pd.NaT or (isinstance(obj, float) and obj != obj):
            return None
    except Exception:
        pass
    return obj


def _session_of(hour: int) -> str:
    if 0 <= hour < 8:   return "Asian"
    if 8 <= hour < 13:  return "London"
    if 13 <= hour < 18: return "New York"
    return "Evening"


def _fmt_dur(secs: float) -> str:
    secs = max(0, secs)
    if secs < 60:   return f"{int(secs)}s"
    if secs < 3600: return f"{int(secs / 60)}m"
    if secs < 86400:
        h = int(secs / 3600); m = int((secs % 3600) / 60)
        return f"{h}h {m}m"
    d = int(secs / 86400); h = int((secs % 86400) / 3600)
    return f"{d}d {h}h"


# ── general statistics ────────────────────────────────────────────────────

def compute_statistics(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not trades:
        return {}

    import pandas as pd  # deferred

    df = pd.DataFrame(trades)
    df["profit"] = pd.to_numeric(df.get("profit", pd.Series(dtype=float)),
                                 errors="coerce").fillna(0)

    total      = len(df)
    winners    = df[df["profit"] > 0]
    losers     = df[df["profit"] < 0]
    win_count  = len(winners)
    loss_count = len(losers)

    gross_profit = round(float(winners["profit"].sum()), 2) if not winners.empty else 0.0
    gross_loss   = round(abs(float(losers["profit"].sum())),  2) if not losers.empty  else 0.0
    total_profit = round(float(df["profit"].sum()), 2)
    avg_profit   = round(float(df["profit"].mean()), 2)
    avg_win      = round(float(winners["profit"].mean()), 2) if not winners.empty else 0.0
    avg_loss_val = round(abs(float(losers["profit"].mean())),  2) if not losers.empty  else 0.0

    win_rate      = round(win_count  / total * 100, 2) if total else 0.0
    loss_rate     = round(loss_count / total * 100, 2) if total else 0.0
    profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else None
    avg_rr        = round(avg_win / avg_loss_val, 2)    if avg_loss_val > 0 else None

    # ── lot / position sizing stats
    lot_col = next((c for c in ("lot", "volume") if c in df.columns), None)
    avg_lot = lot_std = lot_cv = None
    if lot_col:
        df[lot_col] = pd.to_numeric(df[lot_col], errors="coerce")
        if df[lot_col].notna().any():
            avg_lot = round(float(df[lot_col].mean()), 2)
            lot_std = round(float(df[lot_col].std()), 4)
            lot_cv  = round(lot_std / avg_lot * 100, 2) if avg_lot else None

    # ── fees
    swap       = round(float(df["swap"].sum()),       2) if "swap"       in df.columns else 0.0
    commission = round(float(df["commission"].sum()), 2) if "commission" in df.columns else 0.0

    # ── per-symbol stats
    symbol_stats: Dict[str, Any] = {}
    for sym, grp in df.groupby("symbol"):
        sw = len(grp[grp["profit"] > 0])
        st = len(grp)
        symbol_stats[str(sym)] = {
            "total":      st,
            "wins":       sw,
            "win_rate":   round(sw / st * 100, 2) if st else 0.0,
            "profit":     round(float(grp["profit"].sum()),  2),
            "avg_profit": round(float(grp["profit"].mean()), 2),
        }
    best_symbol  = max(symbol_stats, key=lambda s: symbol_stats[s]["profit"]) if symbol_stats else None
    worst_symbol = min(symbol_stats, key=lambda s: symbol_stats[s]["profit"]) if symbol_stats else None

    # ── temporal breakdown
    df["_close_dt"] = pd.to_datetime(df.get("close_time"),  utc=True, errors="coerce")
    df["_open_dt"]  = pd.to_datetime(df.get("open_time"),   utc=True, errors="coerce")
    df["_hour"]     = df["_close_dt"].dt.hour.fillna(df["_open_dt"].dt.hour)
    df["_dow"]      = df["_close_dt"].dt.dayofweek.fillna(df["_open_dt"].dt.dayofweek)
    df["_month"]    = df["_close_dt"].dt.to_period("M").astype(str)
    df["_session"]  = df["_hour"].apply(
        lambda h: _session_of(int(h)) if pd.notna(h) else "Unknown"
    )

    hour_profit = df.groupby("_hour")["profit"].sum()
    best_hour   = int(hour_profit.idxmax()) if not hour_profit.empty else None

    day_profit  = df.groupby("_dow")["profit"].sum()
    best_day    = _DAY_NAMES[int(day_profit.idxmax())] if not day_profit.empty else None

    session_profit: Dict[str, float] = {
        k: round(float(v), 2)
        for k, v in df.groupby("_session")["profit"].sum().items()
    }
    best_session = max(session_profit, key=session_profit.get) if session_profit else None

    monthly_profit: Dict[str, float] = {
        k: round(float(v), 2)
        for k, v in df.groupby("_month")["profit"].sum().items()
    }

    # ── heatmap data  (day × hour)
    heatmap: List[Dict[str, Any]] = []
    for (dow, hour), grp in df.groupby(["_dow", "_hour"]):
        wins_grp   = int((grp["profit"] > 0).sum())
        losses_grp = int((grp["profit"] < 0).sum())
        total_grp  = len(grp)
        heatmap.append({
            "day":      int(dow),
            "day_name": _DAY_NAMES[int(dow)] if int(dow) < 7 else f"Day{int(dow)}",
            "hour":     int(hour),
            "count":    total_grp,
            "wins":     wins_grp,
            "losses":   losses_grp,
            "win_rate": round(wins_grp / total_grp * 100, 1) if total_grp else 0.0,
            "profit":   round(float(grp["profit"].sum()), 2),
            "avg_trade": round(float(grp["profit"].mean()), 2) if total_grp else 0.0,
        })

    # ── hour breakdown series
    by_hour: List[Dict[str, Any]] = [
        {
            "hour":   int(h),
            "count":  int(df[df["_hour"] == h].shape[0]),
            "profit": round(float(df[df["_hour"] == h]["profit"].sum()), 2),
        }
        for h in sorted(df["_hour"].dropna().unique())
    ]

    # ── symbol win-rate chart
    symbol_winrate_chart = {sym: s["win_rate"] for sym, s in symbol_stats.items()}

    # ── consecutive losses
    profits_sorted = df.sort_values("_close_dt")["profit"].tolist()
    max_consec = cur = 0
    for p in profits_sorted:
        if p < 0:
            cur += 1
            max_consec = max(max_consec, cur)
        else:
            cur = 0

    # ── avg duration
    avg_dur_sec = None
    if "duration_seconds" in df.columns:
        ds = pd.to_numeric(df["duration_seconds"], errors="coerce")
        if ds.notna().any():
            avg_dur_sec = float(ds.mean())

    # ── equity curve series
    sorted_df = df.sort_values("_close_dt").reset_index(drop=True)
    cum = 0.0
    equity_curve: List[Dict] = []
    for i, row in sorted_df.iterrows():
        cum += float(row["profit"])
        equity_curve.append({
            "trade":  i + 1,
            "equity": round(cum, 2),
            "date":   str(row["_close_dt"])[:10] if pd.notna(row["_close_dt"]) else "",
        })

    return _pyval({
        "total_trades":        total,
        "win_count":           win_count,
        "loss_count":          loss_count,
        "breakeven_count":     total - win_count - loss_count,
        "win_rate":            win_rate,
        "loss_rate":           loss_rate,
        "total_profit":        total_profit,
        "avg_profit_per_trade": avg_profit,
        "avg_win":             avg_win,
        "avg_loss":            avg_loss_val,
        "gross_profit":        gross_profit,
        "gross_loss":          gross_loss,
        "profit_factor":       profit_factor,
        "avg_risk_reward":     avg_rr,
        "total_swap":          swap,
        "total_commission":    commission,
        "avg_lot":             avg_lot,
        "lot_cv_pct":          lot_cv,
        "best_symbol":         best_symbol,
        "worst_symbol":        worst_symbol,
        "symbol_stats":        symbol_stats,
        "best_hour":           best_hour,
        "best_day":            best_day,
        "best_session":        best_session,
        "session_profit":      session_profit,
        "monthly_profit":      monthly_profit,
        "max_consecutive_losses": max_consec,
        "avg_duration_seconds": avg_dur_sec,
        "avg_trade_duration":  _fmt_dur(avg_dur_sec) if avg_dur_sec else "N/A",
        "heatmap":             heatmap,
        "by_hour":             by_hour,
        "symbol_winrate_chart": symbol_winrate_chart,
        "equity_curve":        equity_curve,
    })


# ── behavioral analysis ───────────────────────────────────────────────────

def compute_behavioral_analysis(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not trades:
        return {}

    import pandas as pd

    df = pd.DataFrame(trades)
    df["profit"]    = pd.to_numeric(df.get("profit", pd.Series(dtype=float)), errors="coerce").fillna(0)
    df["_open_dt"]  = pd.to_datetime(df.get("open_time"),  utc=True, errors="coerce")
    df["_close_dt"] = pd.to_datetime(df.get("close_time"), utc=True, errors="coerce")
    # Mobile screenshots often have null open_time — fall back to close_time for date grouping
    df["_date"] = df["_open_dt"].dt.date.where(df["_open_dt"].notna(), df["_close_dt"].dt.date)
    # Sort by open_time if available, else close_time
    sort_key = df["_open_dt"].where(df["_open_dt"].notna(), df["_close_dt"])
    df = df.assign(_sort_key=sort_key).sort_values("_sort_key").drop(columns="_sort_key").reset_index(drop=True)

    lot_col = next((c for c in ("lot", "volume") if c in df.columns), None)
    if lot_col:
        df[lot_col] = pd.to_numeric(df[lot_col], errors="coerce")

    # 1. Overtrading
    overtrade_threshold = 5
    trades_per_day   = df.groupby("_date").size()
    overtrading_days = trades_per_day[trades_per_day > overtrade_threshold]
    overtrading_detected = not overtrading_days.empty
    max_trades_in_day    = int(trades_per_day.max()) if not trades_per_day.empty else 0

    # 2. Revenge trading — trade opened within 10 min of a loss closing
    # Use close_time as fallback timestamp when open_time is null (mobile format)
    revenge_count = 0
    for i in range(1, len(df)):
        if df.iloc[i - 1]["profit"] < 0:
            prev_close = df.iloc[i - 1]["_close_dt"]
            cur_open   = df.iloc[i]["_open_dt"]
            if pd.isna(cur_open):
                cur_open = df.iloc[i]["_close_dt"]
            if pd.notna(prev_close) and pd.notna(cur_open):
                diff_min = (cur_open - prev_close).total_seconds() / 60
                if 0 < diff_min <= 10:
                    revenge_count += 1
    revenge_detected = revenge_count > 0

    # 3. Bad risk management — loss > 3× average absolute trade size
    avg_abs = df["profit"].abs().mean()
    bad_risk_trades = df[df["profit"] < -(avg_abs * 3)] if avg_abs > 0 else df.iloc[0:0]
    bad_risk_detected = not bad_risk_trades.empty
    bad_risk_count    = len(bad_risk_trades)

    # 4. Inconsistent lot sizing (CoV > 50%)
    lot_cv = None
    inconsistent_sizing = False
    if lot_col and df[lot_col].notna().sum() > 2:
        mean_lot = df[lot_col].mean()
        if mean_lot > 0:
            lot_cv             = round(df[lot_col].std() / mean_lot * 100, 1)
            inconsistent_sizing = lot_cv > 50

    # 5. Lot increase after loss (martingale tendency)
    lot_increase_after_loss = 0
    if lot_col:
        for i in range(1, len(df)):
            if df.iloc[i - 1]["profit"] < 0:
                prev_lot = df.iloc[i - 1][lot_col]
                cur_lot  = df.iloc[i][lot_col]
                if pd.notna(prev_lot) and pd.notna(cur_lot) and cur_lot > prev_lot * 1.2:
                    lot_increase_after_loss += 1

    # 6. Win rate per session
    df["_hour"]    = df["_open_dt"].dt.hour
    df["_session"] = df["_hour"].apply(
        lambda h: _session_of(int(h)) if pd.notna(h) else "Unknown"
    )
    session_wr: Dict[str, float] = {}
    for sess, grp in df.groupby("_session"):
        sw = len(grp[grp["profit"] > 0])
        st = len(grp)
        session_wr[str(sess)] = round(sw / st * 100, 1) if st else 0.0
    best_session = max(session_wr, key=session_wr.get) if session_wr else None

    # 7. Losses after 3 consecutive any-direction trades
    outcomes = (df["profit"] > 0).astype(int).tolist()
    post3_results: List[int] = []
    for i in range(3, len(outcomes)):
        post3_results.append(outcomes[i])
    losses_after_3_pct = (
        round(sum(1 for x in post3_results if x == 0) / len(post3_results) * 100, 1)
        if post3_results else None
    )

    # 8. Post-streak win rate (after 3 consecutive losses)
    post_streak: List[int] = []
    for i in range(3, len(outcomes)):
        if outcomes[i-1] == 0 and outcomes[i-2] == 0 and outcomes[i-3] == 0:
            post_streak.append(outcomes[i])
    post_streak_wr = (
        round(sum(post_streak) / len(post_streak) * 100, 1) if post_streak else None
    )

    return _pyval({
        "overtrading_detected":          overtrading_detected,
        "overtrading_days_count":        int(len(overtrading_days)),
        "max_trades_in_day":             max_trades_in_day,
        "overtrade_threshold":           overtrade_threshold,
        "revenge_trading_detected":      revenge_detected,
        "revenge_trade_count":           revenge_count,
        "bad_risk_management":           bad_risk_detected,
        "bad_risk_trade_count":          bad_risk_count,
        "inconsistent_sizing":           inconsistent_sizing,
        "lot_cv_pct":                    lot_cv,
        "lot_increase_after_loss_count": lot_increase_after_loss,
        "session_win_rates":             session_wr,
        "best_session":                  best_session,
        "post_streak_win_rate":          post_streak_wr,
        "losses_after_3_consecutive_pct": losses_after_3_pct,
    })


# ── AI performance report ─────────────────────────────────────────────────

def generate_ai_report(
    stats: Dict[str, Any],
    behavior: Dict[str, Any],
) -> Dict[str, Any]:
    api_key = _get_gemini_key()
    if api_key:
        try:
            return _gemini_report(stats, behavior, api_key)
        except Exception:
            pass
    return _rule_report(stats, behavior)


def _get_gemini_key() -> Optional[str]:
    k = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_AI_API_KEY", "")
    return k if k and k.lower() not in ("", "demo", "your_key_here") else None


def _rule_report(stats: Dict[str, Any], behavior: Dict[str, Any]) -> Dict[str, Any]:
    wr           = stats.get("win_rate", 0) or 0
    pf           = stats.get("profit_factor") or 0
    total        = stats.get("total_trades", 0) or 0
    best_sym     = stats.get("best_symbol") or "N/A"
    worst_sym    = stats.get("worst_symbol") or "N/A"
    avg_rr       = stats.get("avg_risk_reward")
    total_profit = stats.get("total_profit", 0) or 0
    lot_cv       = behavior.get("lot_cv_pct")
    sym_stats    = stats.get("symbol_stats", {})
    session_wr   = behavior.get("session_win_rates", {})
    best_session = behavior.get("best_session") or stats.get("best_session") or "N/A"
    best_day     = stats.get("best_day") or "N/A"
    best_sess_wr = session_wr.get(best_session, 0) if best_session != "N/A" else 0

    # ── build summary sentence
    parts: List[str] = []
    profit_str = f"+${total_profit:.2f}" if total_profit >= 0 else f"-${abs(total_profit):.2f}"
    parts.append(f"Across {total} closed trades your account shows a net P&L of {profit_str}.")

    if wr > 0 and pf:
        if wr < 50 and pf >= 1.5:
            parts.append(
                f"Your win rate is {wr}% but your profit factor of {pf} indicates "
                f"your winners are larger than your losers — an asymmetric edge."
            )
        elif wr >= 60 and pf >= 1.5:
            parts.append(
                f"With a {wr}% win rate and profit factor of {pf} you show both "
                f"consistency and disciplined trade management."
            )
        else:
            parts.append(f"Win rate: {wr}% · Profit factor: {pf}.")

    if best_session != "N/A":
        sym_part = f" trading {best_sym}" if best_sym != "N/A" else ""
        parts.append(
            f"Your best performance occurs during the {best_session} session{sym_part}."
        )

    flags = []
    if behavior.get("overtrading_detected"):     flags.append("overtrading")
    if behavior.get("inconsistent_sizing"):       flags.append("inconsistent position sizing")
    if behavior.get("revenge_trading_detected"):  flags.append("potential revenge trading")
    if flags:
        parts.append(
            "However, analysis shows " +
            ", ".join(flags[:-1]) +
            (" and " if len(flags) > 1 else "") +
            flags[-1] + "."
        )

    summary = " ".join(parts)

    insights: List[str] = []
    strengths: List[str] = []
    warnings: List[str] = []
    recommendations: List[str] = []

    # Win rate
    if wr >= 60:
        strengths.append(f"Strong win rate of {wr}% — you convert the majority of your setups.")
    elif wr >= 50:
        insights.append(f"Win rate of {wr}% is above breakeven — focus on R:R to compound gains.")
    else:
        warnings.append(f"Win rate of {wr}% is below 50%. Tighten entry criteria.")

    # Profit factor
    if pf and pf >= 2.0:
        strengths.append(f"Excellent profit factor of {pf} — gross winners are at least 2× gross losses.")
    elif pf and pf >= 1.5:
        insights.append(f"Good profit factor of {pf}. System is solidly profitable.")
    elif pf and pf < 1.0:
        warnings.append(f"Profit factor of {pf} is below 1.0 — the strategy is net-losing.")

    # R:R
    if avg_rr and avg_rr >= 2.0:
        strengths.append(f"Average R:R of {avg_rr}:1 reflects disciplined trade exits.")
    elif avg_rr and avg_rr < 1.0:
        warnings.append(f"Average R:R of {avg_rr}:1 — you risk more than you gain per trade.")

    # Best/worst symbol
    if best_sym != "N/A":
        bp = sym_stats.get(best_sym, {}).get("profit", 0)
        bwr = sym_stats.get(best_sym, {}).get("win_rate", 0)
        insights.append(f"Best asset: {best_sym} (+${bp:.2f}, {bwr}% win rate). Increase focus here.")

    if worst_sym != "N/A" and worst_sym != best_sym:
        wp = sym_stats.get(worst_sym, {}).get("profit", 0)
        if wp < 0:
            recommendations.append(
                f"{worst_sym} is your weakest pair (${wp:.2f}). Consider removing it from rotation."
            )

    # Session insight
    if best_session != "N/A" and best_sess_wr:
        insights.append(
            f"Win rate improves to {best_sess_wr}% during the {best_session} session."
        )
    if best_day != "N/A":
        insights.append(f"Most profitable day of the week: {best_day}.")

    # Behavioral
    if behavior.get("overtrading_detected"):
        warnings.append(
            f"Overtrading: up to {behavior.get('max_trades_in_day')} trades in one day. "
            f"More trades ≠ more profit."
        )
        recommendations.append("Cap daily trades at 3–5 to protect your edge.")

    if behavior.get("revenge_trading_detected"):
        warnings.append(
            f"Revenge trading detected: {behavior.get('revenge_trade_count')} trades opened "
            f"within 10 minutes of a loss."
        )
        recommendations.append(
            "Implement a 30-minute mandatory break after any losing trade."
        )

    if behavior.get("inconsistent_sizing"):
        warnings.append(
            f"Position sizing inconsistency (CoV: {lot_cv}%). "
            f"Erratic lot sizes undermine your statistical edge."
        )
        recommendations.append(
            "Use a fixed risk-per-trade rule (e.g. 1% of account per trade)."
        )

    if behavior.get("lot_increase_after_loss_count", 0) > 2:
        cnt = behavior["lot_increase_after_loss_count"]
        warnings.append(
            f"You increased lot size after a loss {cnt} time(s) — a martingale/revenge pattern."
        )

    lp3 = behavior.get("losses_after_3_consecutive_pct")
    if lp3 is not None and lp3 > 50:
        insights.append(
            f"{lp3}% of your losses follow 3 consecutive trades — fatigue or emotional bias detected."
        )

    if behavior.get("bad_risk_management"):
        warnings.append(
            f"{behavior.get('bad_risk_trade_count')} trade(s) had losses >3× average — "
            f"no stop-loss or very wide stops used."
        )
        recommendations.append("Always set a stop-loss before entering a trade.")

    return {
        "summary":                  summary,
        "insights":                 insights,
        "strengths":                strengths,
        "warnings":                 warnings,
        "recommendations":          recommendations,
        "best_asset":               best_sym,
        "best_session":             best_session,
        "overtrading_detected":     behavior.get("overtrading_detected", False),
        "revenge_trading_detected": behavior.get("revenge_trading_detected", False),
        "inconsistent_sizing":      behavior.get("inconsistent_sizing", False),
        "generated_by":             "rule_engine",
    }


def _gemini_report(
    stats: Dict[str, Any],
    behavior: Dict[str, Any],
    api_key: str,
) -> Dict[str, Any]:
    import requests

    prompt = f"""You are a professional trading coach and performance analyst.
Analyse the following trading statistics and behavioral patterns.
Return a JSON object with EXACTLY these keys:
- summary                (string: 3–4 sentences in second person,"Your win rate is...")
- insights               (list of 5–7 data-backed observations)
- strengths              (list of 2–4 positive aspects)
- warnings               (list of 2–4 risk areas)
- recommendations        (list of 3–5 concrete, actionable steps)
- best_asset             (string)
- best_session           (string)
- overtrading_detected   (boolean)
- revenge_trading_detected (boolean)
- inconsistent_sizing    (boolean)
- generated_by           (string: always "gemini")

Performance statistics:
{json.dumps(stats, indent=2, default=str)}

Behavioral analysis:
{json.dumps(behavior, indent=2, default=str)}

Respond ONLY with raw JSON. No markdown, no code fences.
"""

    for model in ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]:
        try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:generateContent?key={api_key}"
            )
            resp = requests.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}],
                      "generationConfig": {"temperature": 0.2, "maxOutputTokens": 4096}},
                timeout=60,
            )
            if resp.status_code == 429:
                continue   # try next model
            resp.raise_for_status()
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```\s*$", "", text)
            result = json.loads(text)
            result["generated_by"] = "gemini"
            return result
        except Exception:
            continue

    raise RuntimeError("All Gemini models unavailable for report generation")
