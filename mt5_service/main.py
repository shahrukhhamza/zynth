"""
FastAPI service — Trade Screenshot Analysis
===========================================

Endpoints
---------
GET  /health                    — liveness check
POST /upload-trade-screenshot   — image → OCR + AI → trades + full analysis
GET  /screenshot-report         — stored screenshot trades + analysis
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import logging
import os
import time
import traceback
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
# Load root .env first (shared secrets like JWT_SECRET), then local .env can override
load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(message)s")

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import init_db, save_trades, get_trades, merge_screenshot_trades
from screenshot_ocr import extract_trades_from_screenshot
from journal_analyzer import compute_statistics, compute_behavioral_analysis, generate_ai_report


# ── JWT helpers (no third-party lib needed) ────────────────────────────────

def _b64url_decode(s: str) -> bytes:
    """Decode base64url without padding."""
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _verify_jwt(token: str) -> dict:
    """
    Verify a HS256 JWT signed with JWT_SECRET.
    Returns the decoded payload dict on success, raises ValueError on failure.
    """
    secret = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
    except ValueError:
        raise ValueError("Malformed token")

    # Verify HMAC-SHA256 signature
    msg = f"{header_b64}.{payload_b64}".encode()
    expected = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), msg, hashlib.sha256).digest()
    ).rstrip(b"=")
    if not hmac.compare_digest(expected, sig_b64.encode()):
        raise ValueError("Invalid signature")

    payload = json.loads(_b64url_decode(payload_b64))

    # Check expiry
    if "exp" in payload and payload["exp"] < time.time():
        raise ValueError("Token expired")

    return payload


def _get_user_id(request: Request) -> str:
    """
    Extract and verify the JWT from the Authorization header.
    Returns a string user key like 'user_42'.
    Raises HTTP 401 if missing or invalid.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")
    token = auth[7:]
    try:
        payload = _verify_jwt(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid or expired session: {exc}")
    uid = payload.get("id") or payload.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="Token contains no user identity.")
    return f"user_{uid}"

# ── App setup ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Trade Screenshot Analysis Service",
    description=(
        "Accepts MetaTrader 4/5 trade-history screenshots, "
        "extracts trades via OCR + Gemini AI, and returns performance analytics."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://zynth.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Upload constraints ─────────────────────────────────────────────────────

_MAX_SIZE     = 15 * 1024 * 1024          # 15 MB
_ALLOWED_EXT  = {".png", ".jpg", ".jpeg", ".webp"}
_EXT_MIME     = {
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

# ── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "Trade Screenshot Analysis"}


@app.post("/upload-trade-screenshot")
async def upload_screenshot(
    request: Request,
    file: UploadFile = File(...),
) -> dict:
    """
    Accept a PNG/JPG MetaTrader 4/5 trade-history screenshot.
    The authenticated user is identified via JWT — no user_id form field needed.
    """
    user_id = _get_user_id(request)
    # ── validate file ──
    filename = file.filename or "upload.png"
    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    if ext not in _ALLOWED_EXT:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unsupported file type '{ext}'. "
                "Please upload a PNG, JPG, or JPEG screenshot."
            ),
        )

    content = await file.read()
    if len(content) > _MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large (max 15 MB). Please upload a smaller screenshot.",
        )

    mime = file.content_type or _EXT_MIME.get(ext, "image/png")

    # ── extract trades (blocking OCR + Gemini REST — run in thread pool) ──
    try:
        trades = await asyncio.to_thread(extract_trades_from_screenshot, content, mime)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Screenshot analysis failed: {exc}",
        )

    if not trades:
        raise HTTPException(
            status_code=422,
            detail=(
                "We could not detect any trades in this screenshot. "
                "Please upload a clear screenshot of the MetaTrader trade history table "
                "with the column headers and all trade rows visible."
            ),
        )

    # ── persist — merge (dedup) instead of replace ──
    try:
        merge_result = await asyncio.to_thread(merge_screenshot_trades, trades, user_id)
    except Exception as exc:
        logging.error("merge_screenshot_trades failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to save trades: {exc}")

    inserted  = merge_result["inserted"]
    duplicates = merge_result["duplicates"]

    # If every single extracted trade was a duplicate, still return success
    # but load all stored trades for analysis
    all_trades = await asyncio.to_thread(get_trades, user_id=user_id, source="screenshot")
    analysis_trades = all_trades if all_trades else trades
    # ── analyse (blocking pandas + Gemini — run in thread pool) ──
    try:
        stats = await asyncio.to_thread(compute_statistics, analysis_trades)
    except Exception as exc:
        logging.error("compute_statistics failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Statistics error: {exc}")

    try:
        behavior = await asyncio.to_thread(compute_behavioral_analysis, analysis_trades)
    except Exception as exc:
        logging.error("compute_behavioral_analysis failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Behavioral analysis error: {exc}")

    try:
        ai_report = await asyncio.to_thread(generate_ai_report, stats, behavior)
    except Exception as exc:
        logging.error("generate_ai_report failed:\n%s", traceback.format_exc())
        ai_report = {"summary": "AI report unavailable.", "generated_by": "fallback"}

    # Build human-readable message
    if inserted == 0:
        msg = f"All {duplicates} trade(s) already existed — no duplicates added."
    elif duplicates == 0:
        msg = f"Successfully imported {inserted} new trade(s)."
    else:
        msg = f"Imported {inserted} new trade(s). Skipped {duplicates} duplicate(s)."

    return {
        "success":          True,
        "message":          msg,
        "trades_extracted": len(trades),
        "trades_inserted":  inserted,
        "trades_duplicate": duplicates,
        "total_stored":     len(all_trades),
        "analysis":         stats,
        "behavior":         behavior,
        "ai_summary":       ai_report,
        "trades":           all_trades,
    }


@app.get("/screenshot-report")
async def screenshot_report(request: Request) -> dict:
    """Return all stored screenshot trades + full analysis for the authenticated user."""
    user_id = _get_user_id(request)
    # Blocking SQLite read — run in thread pool to avoid event-loop stall
    trades = await asyncio.to_thread(get_trades, user_id=user_id, source="screenshot")

    if not trades:
        return {
            "success":    False,
            "message":    (
                "No screenshot data found. "
                "Please upload a trade history screenshot first."
            ),
            "trades":     [],
            "analysis":   None,
            "behavior":   None,
            "ai_summary": None,
        }

    # Blocking pandas + Gemini analysis — run in thread pool
    try:
        stats = await asyncio.to_thread(compute_statistics, trades)
    except Exception as exc:
        logging.error("compute_statistics failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Statistics error: {exc}")

    try:
        behavior = await asyncio.to_thread(compute_behavioral_analysis, trades)
    except Exception as exc:
        logging.error("compute_behavioral_analysis failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Behavioral analysis error: {exc}")

    try:
        ai_report = await asyncio.to_thread(generate_ai_report, stats, behavior)
    except Exception as exc:
        logging.error("generate_ai_report failed:\n%s", traceback.format_exc())
        ai_report = {"summary": "AI report unavailable.", "generated_by": "fallback"}

    return {
        "success":    True,
        "trades":     trades,
        "analysis":   stats,
        "behavior":   behavior,
        "ai_summary": ai_report,
    }


# ── Entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
