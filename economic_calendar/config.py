"""
config.py — Centralised configuration and environment loading.
Reads from the project-root .env (d:/US DATA/.env) automatically.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).parent           # economic_calendar/
PROJECT_ROOT = BASE_DIR.parent                  # d:/US DATA/
CACHE_DIR    = BASE_DIR / "cache"
LOG_DIR      = BASE_DIR / "logs"
OUTPUT_DIR   = BASE_DIR / "output"

# Create directories if they don't exist
for _d in (CACHE_DIR, LOG_DIR, OUTPUT_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# ── Load .env from project root ────────────────────────────────────────────
load_dotenv(PROJECT_ROOT / ".env")

# ── API Keys ───────────────────────────────────────────────────────────────
GEMINI_API_KEY          = os.getenv("GEMINI_API_KEY", "")
FRED_API_KEY            = os.getenv("FRED_API_KEY", "")
BLS_API_KEY             = os.getenv("BLS_API_KEY", "")           # optional — raises rate limit
TRADING_ECONOMICS_KEY   = os.getenv("TRADING_ECONOMICS_KEY", "") # optional — for forecasts

# ── App metadata ──────────────────────────────────────────────────────────
APP_VERSION = "1.0.0"

# ── Network ────────────────────────────────────────────────────────────────
REQUEST_TIMEOUT      = 30   # seconds (generic)
BLS_REQUEST_TIMEOUT  = 40   # BLS can be slow
FRED_REQUEST_TIMEOUT = 30
MAX_RETRIES          = 2
RETRY_DELAY          = 2    # seconds between retries

# ── Cache ──────────────────────────────────────────────────────────────────
CACHE_TTL_SECONDS  = 1800  # 30 minutes — releases are not that frequent

# ── Validation ─────────────────────────────────────────────────────────────
# If two sources differ by more than this %, flag it for Gemini review
DISCREPANCY_THRESHOLD = 0.15   # 0.15 percentage points

# ── BLS Series IDs ─────────────────────────────────────────────────────────
BLS_SERIES = {
    "CPI":          "CUSR0000SA0",   # CPI-U All Urban Consumers All Items, SA
    "PPI":          "WPSFD49110",    # PPI Final Demand, SA
    "Unemployment": "LNS14000000",   # Unemployment Rate, SA
}

# ── FRED Series IDs ────────────────────────────────────────────────────────
FRED_SERIES = {
    "CPI":          "CPIAUCSL",      # CPI for All Urban Consumers, SA
    "Unemployment": "UNRATE",        # Civilian Unemployment Rate, SA
    "FedRate":      "FEDFUNDS",      # Effective Federal Funds Rate
    "FedRateUpper": "DFEDTARU",      # Target Upper
    "FedRateLower": "DFEDTARL",      # Target Lower
    "PPI":          "PPIACO",        # PPI: All Commodities
    "RetailSales":  "RSAFS",         # Advance Retail Sales: Retail & Food Services, SA
}

# ── Indicator display metadata ─────────────────────────────────────────────
INDICATOR_META = {
    "CPI":          {"label": "CPI m/m",             "unit": "%", "invert": False},
    "PPI":          {"label": "PPI m/m",             "unit": "%", "invert": False},
    "Unemployment": {"label": "Unemployment Rate",   "unit": "%", "invert": True},  # lower = better
    "RetailSales":  {"label": "Retail Sales m/m",    "unit": "%", "invert": False},
    "FedRate":      {"label": "Fed Interest Rate",   "unit": "%", "invert": False},
}
