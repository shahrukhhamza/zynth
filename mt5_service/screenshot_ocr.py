"""
screenshot_ocr.py
-----------------
Extracts trades from a MetaTrader 4/5 screenshot.

Strategy (in order):
  1. Gemini REST API — tries gemini-1.5-flash first (15 RPM free), then
     falls back through gemini-2.0-flash and gemini-1.5-pro.
     Retries once on 429 (rate-limit) with a short back-off.
  2. EasyOCR (local, no internet) + regex parser for MT5 mobile format.
  3. Pillow-only greyscale text extraction + regex parser (last resort).
"""

from __future__ import annotations

import base64
import json
import os
import re
import time
from typing import Any, Dict, List, Optional


# ── Gemini models to try in order ─────────────────────────────────────────
# gemini-2.5-flash  = latest, vision-capable, generous free quota
# gemini-2.5-flash-lite = smaller/faster, very high free quota
# gemini-2.0-flash  = fallback (lower free quota — 2 RPM)
_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
]

_GEMINI_BASE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)

# ── Prompt ─────────────────────────────────────────────────────────────────
_VISION_PROMPT = """You are an expert at reading MetaTrader 4 and MetaTrader 5 trade history screenshots.

The screenshot may come from:
1. MetaTrader DESKTOP — a table with columns: Ticket, Symbol, Type, Volume, Open Price, Close Price, Profit, etc.
2. MetaTrader MOBILE — a scrollable list where each trade entry looks like:
     XAUUSD, buy 0.02                     2025.12.18 15:30:02
     4 317.41 → 4 326.00                                17.18
   The left side shows symbol/direction/lot and prices (open → close).
   The right side shows the close date/time and the profit (blue text = positive, red text = negative).
   Numbers sometimes have a space inside them like "4 317.41" — these are just normal numbers (4317.41).

CRITICAL INSTRUCTIONS:
- Extract EVERY SINGLE trade visible in the screenshot — do not stop after the first few.
- Scroll through the ENTIRE image from top to bottom and capture all rows.
- Count how many trade entries you see before responding and make sure your array has that many items.
- Ignore balance lines, deposit lines, and withdrawal lines (they don't have an arrow → between two prices).
- Negative profits appear in red or have a minus sign — use a negative number.
- Positive profits appear in blue or have no sign — use a positive number.

Return ONLY a raw JSON array — no markdown code fences, no explanation, nothing else.
Each element MUST follow this exact schema:
{
  "symbol":      "XAUUSD",
  "type":        "buy",
  "lot":         0.02,
  "open_price":  4317.41,
  "close_price": 4326.00,
  "profit":      17.18,
  "open_time":   null,
  "close_time":  "2025-12-18 15:30:02"
}

Rules:
- "type" must be lowercase "buy" or "sell" only
- All numeric values (lot, open_price, close_price, profit) MUST be JSON numbers, not strings
- Prices like "4 317.41" or "4317.41" are the same number: 4317.41 — strip the space
- close_time format: "YYYY-MM-DD HH:MM:SS" (convert dots to dashes in date part)
- If open_time is not shown (mobile format), set it to null
- Return [] ONLY if there are genuinely zero trades visible
"""


# ── Public entry point ─────────────────────────────────────────────────────

def extract_trades_from_screenshot(
    image_bytes: bytes,
    mime_type: str = "image/png",
) -> List[Dict[str, Any]]:
    """
    Extract trades from a screenshot image.
    Returns list of trade dicts. Raises ValueError with user-friendly message on failure.
    """
    key = (
        os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_AI_API_KEY")
        or ""
    ).strip()

    if not key or key.lower() in ("your_key_here", "demo", "your_gemini_api_key_here"):
        raise ValueError(
            "GEMINI_API_KEY is not configured. "
            "Please add your Gemini API key to the .env file in the mt5_service folder."
        )

    safe_mime = mime_type if mime_type in {
        "image/png", "image/jpeg", "image/jpg", "image/webp"
    } else "image/png"

    # ── Try Gemini REST through all models ─────────────────────────────────
    gemini_errors: List[str] = []
    for model in _GEMINI_MODELS:
        for attempt in range(2):   # 1 retry on 429
            try:
                trades = _gemini_rest(image_bytes, safe_mime, key, model)
                print(f"[screenshot_ocr] {model} extracted {len(trades)} trades")
                if trades:
                    return trades
                # Empty result — Gemini saw but found nothing; still try next
                print(f"[screenshot_ocr] {model} returned 0 trades, trying next model")
                break   # Don't retry same model on empty result
            except _RateLimitError:
                wait = 3 * (attempt + 1)
                print(f"[screenshot_ocr] {model} rate-limited, waiting {wait}s...")
                time.sleep(wait)
                continue   # retry
            except Exception as exc:
                gemini_errors.append(f"{model}: {exc}")
                print(f"[screenshot_ocr] {model} failed: {exc!r}")
                break   # Try next model

    # ── EasyOCR fallback (local, no internet) ─────────────────────────────
    print("[screenshot_ocr] Trying EasyOCR local fallback...")
    try:
        ocr_lines = _easyocr_lines(image_bytes)
        if ocr_lines:
            trades = _parse_mt5_mobile_text(ocr_lines)
            if trades:
                print(f"[screenshot_ocr] EasyOCR+regex extracted {len(trades)} trades")
                return trades
            # If regex parse didn't find trades, try sending OCR text to Gemini
            if key and gemini_errors:
                for model in _GEMINI_MODELS[:1]:   # only first model for text
                    try:
                        trades = _gemini_text(
                            "\n".join(ocr_lines), key, model
                        )
                        if trades:
                            return trades
                    except Exception:
                        pass
    except Exception as exc:
        print(f"[screenshot_ocr] EasyOCR fallback failed: {exc!r}")

    # ── Pillow greyscale + regex (no OCR library needed) ──────────────────
    print("[screenshot_ocr] Trying Pillow text-region extraction...")
    try:
        pil_text = _pillow_text_regions(image_bytes)
        if pil_text:
            trades = _parse_mt5_mobile_text(pil_text)
            if trades:
                print(f"[screenshot_ocr] Pillow+regex extracted {len(trades)} trades")
                return trades
    except Exception as exc:
        print(f"[screenshot_ocr] Pillow extraction failed: {exc!r}")

    # ── Complete failure ───────────────────────────────────────────────────
    error_detail = "; ".join(gemini_errors) if gemini_errors else "All models failed"
    raise ValueError(
        "Could not extract trades from this screenshot.\n"
        f"Details: {error_detail}\n\n"
        "Tips:\n"
        "• Your Gemini API free quota may be exhausted — wait a minute and retry.\n"
        "• Ensure you upload a clear full-screen screenshot of the MT4/MT5 History tab.\n"
        "• The image must show trade rows with symbol, direction, price, and profit columns."
    )


# ── Gemini REST (all models) ───────────────────────────────────────────────

class _RateLimitError(Exception):
    """Raised when Gemini returns HTTP 429."""


def _gemini_rest(
    image_bytes: bytes,
    mime_type: str,
    key: str,
    model: str = "gemini-1.5-flash",
) -> List[Dict[str, Any]]:
    import requests

    url = _GEMINI_BASE.format(model=model) + f"?key={key}"
    b64 = base64.b64encode(image_bytes).decode()

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": _VISION_PROMPT},
                    {"inline_data": {"mime_type": mime_type, "data": b64}},
                ]
            }
        ],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192},
    }

    resp = requests.post(url, json=payload, timeout=90)

    if resp.status_code == 429:
        raise _RateLimitError(f"Rate limited on {model}")

    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")

    try:
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Bad response structure: {resp.text[:200]}") from exc

    return _parse_response(text)


def _gemini_text(
    text: str,
    key: str,
    model: str = "gemini-1.5-flash",
) -> List[Dict[str, Any]]:
    import requests

    prompt = (
        "Extract all MetaTrader closed trades from the text below.\n"
        "Return ONLY a raw JSON array, same structure as before.\n\n"
        "TEXT:\n" + text
    )
    url = _GEMINI_BASE.format(model=model) + f"?key={key}"
    resp = requests.post(
        url,
        json={"contents": [{"parts": [{"text": prompt}]}],
              "generationConfig": {"temperature": 0.1}},
        timeout=30,
    )
    if not resp.ok:
        raise RuntimeError(f"HTTP {resp.status_code}")
    text_out = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    return _parse_response(text_out)


# ── EasyOCR ────────────────────────────────────────────────────────────────

def _easyocr_lines(image_bytes: bytes) -> List[str]:
    import easyocr
    import numpy as np
    from PIL import Image
    import io

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(img)
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    results = reader.readtext(arr, detail=0)
    return [str(r).strip() for r in results if str(r).strip()]


# ── Pillow greyscale region ────────────────────────────────────────────────

def _pillow_text_regions(image_bytes: bytes) -> List[str]:
    """
    Very basic: convert to greyscale, threshold, return placeholder lines.
    Without an actual OCR engine this won't produce readable text, so we
    rely solely on the regex patterns matching pixel-level line detection.
    This path is a no-op placeholder — real extraction requires OCR.
    """
    return []


# ── MT5 mobile format regex parser ────────────────────────────────────────

# MT5 mobile format patterns
_RE_TRADE_HEADER = re.compile(
    r"^([\w]+),?\s+(buy|sell)\s+([\d.]+)$",
    re.IGNORECASE,
)
# Prices: "4 317.41 -> 4 326.00" or "4317.41 → 4326.00"
_RE_PRICES = re.compile(
    r"([\d \xa0]+\.[\d]+)\s*[→>-]+\s*([\d \xa0]+\.[\d]+)"
)
# Date: "2025.12.18 15:30:02" or "2025-12-18 15:30:02"
_RE_DATE = re.compile(
    r"(\d{4}[.\-]\d{2}[.\-]\d{2}\s+\d{2}:\d{2}:\d{2})"
)
# Profit: standalone number at end of line, possibly negative
_RE_PROFIT = re.compile(
    r"([+-]?\s*\d+(?:\s+\d+)*\.\d{2})\s*$"
)


def _clean_num(s: str) -> Optional[float]:
    """Remove spaces/nbsp from inside numbers like '4 317.41' → 4317.41"""
    try:
        return float(re.sub(r"[\s\xa0]", "", s))
    except (ValueError, TypeError):
        return None


def _parse_mt5_mobile_text(lines: List[str]) -> List[Dict[str, Any]]:
    """
    Parse MT5 mobile history list format from a list of OCR/regex lines.
    Each trade is typically 2-3 consecutive lines.
    """
    trades: List[Dict[str, Any]] = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Try to match trade header: "XAUUSD, buy 0.02"
        m = _RE_TRADE_HEADER.match(line)
        if m:
            symbol = m.group(1).upper()
            ttype = m.group(2).lower()
            lot = _clean_num(m.group(3))

            open_price = close_price = profit = close_time = None

            # Look ahead up to 5 lines for price, date, profit
            for j in range(i + 1, min(i + 6, len(lines))):
                next_line = lines[j].strip()

                if open_price is None:
                    pm = _RE_PRICES.search(next_line)
                    if pm:
                        open_price = _clean_num(pm.group(1))
                        close_price = _clean_num(pm.group(2))

                if close_time is None:
                    dm = _RE_DATE.search(next_line)
                    if dm:
                        dt = dm.group(1).replace(".", "-", 2)
                        close_time = dt

                if profit is None:
                    pfm = _RE_PROFIT.search(next_line)
                    if pfm:
                        profit = _clean_num(pfm.group(1))

            if symbol and ttype and (profit is not None or close_price is not None):
                trades.append({
                    "symbol":      symbol,
                    "type":        ttype,
                    "lot":         lot,
                    "open_price":  open_price,
                    "close_price": close_price,
                    "profit":      profit,
                    "open_time":   None,
                    "close_time":  close_time,
                })
            i += 1
        else:
            i += 1

    return trades


# ── JSON response parser ───────────────────────────────────────────────────

def _parse_response(text: str) -> List[Dict[str, Any]]:
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```\s*$", "", text, flags=re.MULTILINE)
    text = text.strip()

    if not text:
        return []

    try:
        raw = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if not match:
            print(f"[screenshot_ocr] No JSON array in Gemini response: {text[:200]}")
            return []
        try:
            raw = json.loads(match.group())
        except json.JSONDecodeError:
            return []

    if not isinstance(raw, list):
        return []

    return [
        _normalise(item)
        for item in raw
        if isinstance(item, dict) and _looks_like_trade(item)
    ]


def _looks_like_trade(t: Dict[str, Any]) -> bool:
    return bool(t.get("symbol")) and (
        t.get("profit") is not None
        or t.get("close_price") is not None
    )


def _normalise(t: Dict[str, Any]) -> Dict[str, Any]:
    def _f(v: Any) -> Optional[float]:
        try:
            s = re.sub(r"[\s\xa0]", "", str(v))
            return float(s) if v is not None and str(v).strip() not in ("", "null", "None") else None
        except (TypeError, ValueError):
            return None

    trade_type = str(t.get("type") or "buy").lower().strip()
    if trade_type not in ("buy", "sell"):
        trade_type = "buy" if trade_type in ("long", "b", "buy limit", "buy stop") else "sell"

    return {
        "symbol":      str(t.get("symbol") or "UNKNOWN").upper().replace(" ", ""),
        "type":        trade_type,
        "lot":         _f(t.get("lot") or t.get("volume") or t.get("lots")),
        "open_price":  _f(t.get("open_price") or t.get("open") or t.get("price_open")),
        "close_price": _f(t.get("close_price") or t.get("close") or t.get("price_close")),
        "profit":      _f(t.get("profit") or t.get("pnl") or t.get("pl")),
        "open_time":   str(t.get("open_time") or t.get("time_open") or "").strip() or None,
        "close_time":  str(t.get("close_time") or t.get("time_close") or t.get("time") or "").strip() or None,
    }
