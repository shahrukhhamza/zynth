"""
AI-powered trade analysis insights.

Tries Google Gemini first (requires GEMINI_API_KEY env var).
Falls back to a deterministic rule engine that is always available.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List


def generate_ai_summary(
    trades: List[Dict[str, Any]],
    analysis: Dict[str, Any],
) -> Dict[str, Any]:
    """Return an insights dict from either Gemini or the rule engine."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_AI_API_KEY", "")
    if api_key and api_key.lower() not in ("", "demo", "your_key_here"):
        try:
            return _gemini_summary(trades, analysis, api_key)
        except Exception:
            pass  # fall through to rule engine

    return _rule_summary(analysis)


# ── Rule-based engine ──────────────────────────────────────────────────────

def _rule_summary(analysis: Dict[str, Any]) -> Dict[str, Any]:
    wr = analysis.get("win_rate", 0) or 0
    pf = analysis.get("profit_factor") or 0
    total = analysis.get("total_trades", 0) or 0
    consec = analysis.get("max_consecutive_losses", 0) or 0
    avg_rr = analysis.get("avg_risk_reward") or 0
    best_sym = analysis.get("best_symbol")
    worst_sym = analysis.get("worst_symbol")
    best_session = analysis.get("best_session")
    total_profit = analysis.get("total_profit", 0) or 0
    sym_stats = analysis.get("symbol_stats", {})
    session_profit = analysis.get("session_profit", {})

    insights: List[str] = []
    strengths: List[str] = []
    warnings: List[str] = []
    recommendations: List[str] = []

    # Win rate
    if wr >= 60:
        strengths.append(
            f"Strong win rate of {wr}% — you are converting the majority of your setups."
        )
    elif wr >= 50:
        insights.append(
            f"Win rate of {wr}% is above breakeven. Improving average R:R will compound results."
        )
    else:
        warnings.append(
            f"Win rate of {wr}% is below 50%. Tighten entry criteria or reduce trading frequency."
        )

    # Profit factor
    if pf and pf >= 2.0:
        strengths.append(
            f"Excellent profit factor of {pf} — gross winners are at least double gross losers."
        )
    elif pf and pf >= 1.5:
        insights.append(f"Good profit factor of {pf}. System is solidly profitable.")
    elif pf and 1.0 <= pf < 1.5:
        warnings.append(
            f"Marginal profit factor of {pf}. A few bad trades could tip the system to a loss."
        )
    elif pf and pf < 1.0:
        warnings.append(
            f"Profit factor of {pf} is below 1.0 — the strategy is losing money overall."
        )

    # Risk-reward
    if avg_rr and avg_rr >= 2.0:
        strengths.append(f"Average R:R of {avg_rr}:1 reflects disciplined trade management.")
    elif avg_rr and avg_rr < 1.0:
        warnings.append(
            f"Average R:R of {avg_rr}:1 is below 1:1. You are risking more than you stand to gain."
        )

    # Overtrading
    overtrading = total > 100
    if overtrading:
        warnings.append(
            f"High trade count ({total} trades). Overtrading often erodes edge "
            "through increased commission drag and emotional fatigue."
        )

    # Consecutive losses
    consec_risk = consec >= 5
    if consec >= 7:
        warnings.append(
            f"Maximum streak of {consec} consecutive losses detected. "
            "Implement a daily / weekly drawdown circuit-breaker."
        )
    elif consec >= 4:
        recommendations.append(
            f"You hit up to {consec} consecutive losses. Consider pausing after "
            "3 back-to-back losses to reassess market conditions."
        )

    # Best asset
    if best_sym:
        bp = sym_stats.get(best_sym, {}).get("profit", 0)
        insights.append(
            f"Best performing asset: {best_sym} (+${bp:.2f}). "
            "Consider allocating more focus to this instrument."
        )

    # Worst asset
    if worst_sym and worst_sym != best_sym:
        wp = sym_stats.get(worst_sym, {}).get("profit", 0)
        if wp < 0:
            recommendations.append(
                f"{worst_sym} is your weakest pair (${wp:.2f}). "
                "Review or temporarily remove it from your watchlist."
            )

    # Best session
    if best_session:
        sp = session_profit.get(best_session, 0)
        insights.append(
            f"Most profitable session: {best_session} (${sp:.2f}). "
            "Concentrate trading hours around this window."
        )

    # Overall summary
    if total_profit >= 0:
        summary = (
            f"Portfolio is net profitable with ${total_profit:.2f} across {total} closed trades. "
            f"Win rate is {wr}% with a profit factor of {pf}."
        )
    else:
        summary = (
            f"Portfolio shows a net loss of ${abs(total_profit):.2f} across {total} trades. "
            "The strategy requires structural improvement before scaling position size."
        )

    return {
        "summary": summary,
        "insights": insights,
        "strengths": strengths,
        "warnings": warnings,
        "recommendations": recommendations,
        "best_asset": best_sym,
        "best_session": best_session,
        "overtrading_detected": overtrading,
        "consecutive_loss_risk": consec_risk,
        "generated_by": "rule_engine",
    }


# ── Gemini engine ──────────────────────────────────────────────────────────

def _gemini_summary(
    trades: List[Dict[str, Any]],
    analysis: Dict[str, Any],
    api_key: str,
) -> Dict[str, Any]:
    """Call Google Gemini to generate natural-language trade insights."""
    import google.generativeai as genai  # noqa: PLC0415

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""You are an expert trading performance analyst.
Analyse the following trading statistics and return a JSON object with these exact keys:
- summary        (string: 2-3 sentence executive summary)
- insights       (list of 4-6 specific, data-backed observations)
- strengths      (list of what the trader does well)
- warnings       (list of risk areas that need attention)
- recommendations (list of concrete, actionable improvements)
- best_asset     (string: best performing symbol)
- best_session   (string: most profitable trading session)
- overtrading_detected    (boolean)
- consecutive_loss_risk   (boolean)
- generated_by   (string: always "gemini")

Performance data:
{json.dumps(analysis, indent=2)}

Respond ONLY with the raw JSON object. No markdown, no code fences.
"""

    response = model.generate_content(prompt)
    text = response.text.strip()

    # Strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    result = json.loads(text)
    result["generated_by"] = "gemini"
    return result
