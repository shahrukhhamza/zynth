"""
gemini_reasoning.py — Gemini as a reasoning-only layer.

Rules:
  • Gemini is NEVER used to generate or fabricate numeric data values.
  • It is called in two situations only:
      1. A cross-source discrepancy was flagged by the validator.
      2. The user requests a brief market analysis summary (--analysis flag).
  • Every Gemini prompt explicitly tells the model NOT to produce numbers
    that contradict the official figures already fetched from BLS / FRED.
"""

import logging
from typing import Dict, List, Optional

from config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

# Lazy-import so the tool works even without google-genai installed,
# as long as Gemini features aren't requested.
_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    try:
        from google import genai
        _client = genai.Client(api_key=GEMINI_API_KEY)
        return _client
    except ImportError:
        logger.error(
            "google-genai is not installed. "
            "Run: pip install google-genai"
        )
        return None


def _call_gemini(prompt: str, model: str = "gemini-2.0-flash") -> Optional[str]:
    """Send a single-turn prompt to Gemini and return the text response."""
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — skipping Gemini analysis.")
        return None

    client = _get_client()
    if client is None:
        return None

    try:
        response = client.models.generate_content(
            model    = model,
            contents = prompt,
        )
        return response.text.strip()
    except Exception as exc:     # noqa: BLE001
        logger.error("Gemini API call failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Discrepancy investigation
# ---------------------------------------------------------------------------

DISCREPANCY_PROMPT = """\
You are an expert economic data analyst. Two official sources have reported \
slightly different values for the same indicator. Your job is to reason about \
which value is more likely correct and why, based on methodology differences.

IMPORTANT RULES:
- Do NOT invent or guess any numeric values.
- Do NOT contradict the numbers below — they come directly from official APIs.
- Respond in 2–4 concise sentences only.

Indicator : {indicator}
Period    : {period}
BLS value : {bls_value}
FRED value: {fred_value}
Difference: {difference}

Explain the most likely reason for this discrepancy (e.g., seasonal \
adjustment methodology, revision timing, series definition differences) and \
which source should be treated as primary for this specific indicator.
"""


def investigate_discrepancy(record: Dict) -> Optional[str]:
    """
    Ask Gemini why BLS and FRED disagree for a specific indicator.
    Returns a short explanation string, or None if Gemini is unavailable.
    """
    prompt = DISCREPANCY_PROMPT.format(
        indicator  = record.get("indicator", "?"),
        period     = record.get("period",    "?"),
        bls_value  = record.get("bls_value", "N/A"),
        fred_value = record.get("fred_value","N/A"),
        difference = record.get("discrepancy", "N/A"),
    )
    return _call_gemini(prompt)


# ---------------------------------------------------------------------------
# Market analysis summary
# ---------------------------------------------------------------------------

ANALYSIS_PROMPT = """\
You are a senior macroeconomic analyst. Using ONLY the verified economic data \
below (sourced directly from BLS and FRED official APIs), provide a brief \
market analysis suitable for a professional trader.

CRITICAL RULES:
- Use ONLY the numbers provided below — do NOT add, change, or fabricate any figures.
- Do NOT speculate about specific future prices.
- Respond in 3–5 bullet points, each on a new line starting with "•".

Current Economic Snapshot (official BLS / FRED data):
{data_summary}

Provide insight on:
• Overall inflation trend (CPI + PPI together)
• Labor market health (Unemployment)
• Monetary policy context (Fed Rate)
• Consumer activity (Retail Sales)
• Broader USD / market implication
"""


def generate_market_analysis(records: List[Dict]) -> Optional[str]:
    """
    Generate a brief market analysis based on verified indicator values.
    Gemini is explicitly told not to change numbers.
    """
    lines = []
    for r in records:
        actual   = f"{r['actual']:.2f}{r['unit']}"   if r.get("actual")   is not None else "N/A"
        previous = f"{r['previous']:.2f}{r['unit']}" if r.get("previous") is not None else "N/A"
        forecast = f"{r['forecast']:.2f}{r['unit']}" if r.get("forecast") is not None else "N/A"
        lines.append(
            f"  {r['indicator']:<22} Actual: {actual:<8}  "
            f"Previous: {previous:<8}  Forecast: {forecast:<8}  "
            f"Source: {r.get('source','?')}"
        )

    data_summary = "\n".join(lines)
    prompt = ANALYSIS_PROMPT.format(data_summary=data_summary)
    return _call_gemini(prompt)
