"""
data_fetcher.py — Primary data sources for the economic calendar.

Sources:
  BLSFetcher     : U.S. Bureau of Labor Statistics official API (CPI, PPI, Unemployment)
  FREDFetcher    : Federal Reserve Economic Data API (CPI, Unemployment, Fed Rate, PPI, Retail Sales)
  TEFetcher      : Trading Economics (optional — analyst consensus forecasts only)

Gemini is NOT used here. It is called later only for reasoning about discrepancies.
"""

import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

import requests

from config import (
    BLS_API_KEY,
    BLS_REQUEST_TIMEOUT,
    BLS_SERIES,
    CACHE_TTL_SECONDS,
    FRED_API_KEY,
    FRED_REQUEST_TIMEOUT,
    FRED_SERIES,
    REQUEST_TIMEOUT,
    TRADING_ECONOMICS_KEY,
)
from cache import get as get_cached, set as set_cached

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _calc_mom(current: float, previous: float) -> Optional[float]:
    """Percent change: (current - previous) / previous * 100."""
    if previous and previous != 0:
        return round((current - previous) / abs(previous) * 100, 2)
    return None


# ---------------------------------------------------------------------------
# BLS Fetcher
# ---------------------------------------------------------------------------

class BLSFetcher:
    """Fetches BLS time-series data from the official BLS Public API v2."""

    BASE_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _fetch(self, series_ids: list, years_back: int = 2) -> Dict:
        current_year = datetime.now().year
        payload: Dict = {
            "seriesid": series_ids,
            "startyear": str(current_year - years_back),
            "endyear": str(current_year),
        }
        if BLS_API_KEY:
            payload["registrationkey"] = BLS_API_KEY

        try:
            resp = self.session.post(
                self.BASE_URL,
                data=json.dumps(payload),
                timeout=BLS_REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as exc:
            logger.error("BLS request failed: %s", exc)
            return {}

        if data.get("status") != "REQUEST_SUCCEEDED":
            msgs = data.get("message", [])
            logger.error("BLS API error: %s", msgs)
            return {}

        return data

    def _sorted_observations(self, series_id: str, n: int = 4) -> list:
        """Return the n most-recent monthly observations, sorted newest-first."""
        cache_key = f"bls_{series_id}"
        cached = get_cached(cache_key)
        if cached is not None:
            return cached

        data = self._fetch([series_id])
        if not data or "Results" not in data:
            return []

        raw_series = data["Results"].get("series", [])
        if not raw_series:
            return []

        observations = [
            obs for obs in raw_series[0].get("data", [])
            if obs.get("period", "M13") != "M13"  # M13 = annual avg, skip
        ]

        sorted_obs = sorted(
            observations,
            key=lambda x: (int(x["year"]), int(x["period"][1:])),
            reverse=True,
        )

        result = sorted_obs[:n]
        set_cached(cache_key, result, ttl=CACHE_TTL_SECONDS)
        return result

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def get_cpi(self) -> Dict:
        """CPI m/m (actual), previous m/m, index value, release date."""
        obs = self._sorted_observations(BLS_SERIES["CPI"], n=4)
        if len(obs) < 3:
            return {"error": "Insufficient BLS CPI data"}

        # obs[0] = most recent month, obs[1] = previous, obs[2] = two months ago
        idx0 = float(obs[0]["value"])
        idx1 = float(obs[1]["value"])
        idx2 = float(obs[2]["value"])

        actual_mom = _calc_mom(idx0, idx1)
        prev_mom   = _calc_mom(idx1, idx2)

        year   = obs[0]["year"]
        period = obs[0]["periodName"]

        return {
            "indicator":   "CPI m/m",
            "actual":      actual_mom,
            "previous":    prev_mom,
            "forecast":    None,
            "index_value": idx0,
            "period":      f"{period} {year}",
            "unit":        "%",
            "source":      "BLS",
            "series_id":   BLS_SERIES["CPI"],
        }

    def get_ppi(self) -> Dict:
        """PPI m/m (actual), previous m/m."""
        obs = self._sorted_observations(BLS_SERIES["PPI"], n=4)
        if len(obs) < 3:
            return {"error": "Insufficient BLS PPI data"}

        idx0 = float(obs[0]["value"])
        idx1 = float(obs[1]["value"])
        idx2 = float(obs[2]["value"])

        actual_mom = _calc_mom(idx0, idx1)
        prev_mom   = _calc_mom(idx1, idx2)

        year   = obs[0]["year"]
        period = obs[0]["periodName"]

        return {
            "indicator":   "PPI m/m",
            "actual":      actual_mom,
            "previous":    prev_mom,
            "forecast":    None,
            "index_value": idx0,
            "period":      f"{period} {year}",
            "unit":        "%",
            "source":      "BLS",
            "series_id":   BLS_SERIES["PPI"],
        }

    def get_unemployment(self) -> Dict:
        """Unemployment rate (already a %, no calculation needed)."""
        obs = self._sorted_observations(BLS_SERIES["Unemployment"], n=3)
        if len(obs) < 2:
            return {"error": "Insufficient BLS Unemployment data"}

        actual   = float(obs[0]["value"])
        previous = float(obs[1]["value"])
        year     = obs[0]["year"]
        period   = obs[0]["periodName"]

        return {
            "indicator": "Unemployment Rate",
            "actual":    actual,
            "previous":  previous,
            "forecast":  None,
            "period":    f"{period} {year}",
            "unit":      "%",
            "source":    "BLS",
            "series_id": BLS_SERIES["Unemployment"],
        }


# ---------------------------------------------------------------------------
# FRED Fetcher
# ---------------------------------------------------------------------------

class FREDFetcher:
    """Fetches time-series data from the Federal Reserve's FRED API."""

    BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

    def __init__(self):
        self.session = requests.Session()

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _fetch(self, series_id: str, limit: int = 5) -> list:
        """Return up to `limit` most-recent observations (newest first)."""
        if not FRED_API_KEY:
            logger.warning("FRED_API_KEY not set — skipping FRED fetch for %s", series_id)
            return []

        cache_key = f"fred_{series_id}"
        cached = get_cached(cache_key)
        if cached is not None:
            return cached

        params = {
            "series_id":  series_id,
            "api_key":    FRED_API_KEY,
            "file_type":  "json",
            "sort_order": "desc",
            "limit":      limit,
        }

        try:
            resp = self.session.get(self.BASE_URL, params=params, timeout=FRED_REQUEST_TIMEOUT)
            resp.raise_for_status()
            raw = resp.json()
        except requests.RequestException as exc:
            logger.error("FRED request failed for %s: %s", series_id, exc)
            return []

        obs = [o for o in raw.get("observations", []) if o.get("value", ".") != "."]
        set_cached(cache_key, obs, ttl=CACHE_TTL_SECONDS)
        return obs

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def get_cpi(self) -> Dict:
        """CPI m/m from FRED CPIAUCSL (cross-check source)."""
        obs = self._fetch(FRED_SERIES["CPI"], limit=5)
        if len(obs) < 3:
            return {"error": "Insufficient FRED CPI data"}

        idx0 = float(obs[0]["value"])
        idx1 = float(obs[1]["value"])
        idx2 = float(obs[2]["value"])

        actual_mom = _calc_mom(idx0, idx1)
        prev_mom   = _calc_mom(idx1, idx2)

        return {
            "indicator": "CPI m/m",
            "actual":    actual_mom,
            "previous":  prev_mom,
            "forecast":  None,
            "period":    obs[0]["date"],
            "unit":      "%",
            "source":    "FRED",
            "series_id": FRED_SERIES["CPI"],
        }

    def get_unemployment(self) -> Dict:
        """Unemployment rate from FRED UNRATE."""
        obs = self._fetch(FRED_SERIES["Unemployment"], limit=3)
        if len(obs) < 2:
            return {"error": "Insufficient FRED Unemployment data"}

        return {
            "indicator": "Unemployment Rate",
            "actual":    float(obs[0]["value"]),
            "previous":  float(obs[1]["value"]),
            "forecast":  None,
            "period":    obs[0]["date"],
            "unit":      "%",
            "source":    "FRED",
            "series_id": FRED_SERIES["Unemployment"],
        }

    def get_fed_rate(self) -> Dict:
        """Effective Federal Funds Rate from FRED FEDFUNDS."""
        obs = self._fetch(FRED_SERIES["FedRate"], limit=3)
        if len(obs) < 2:
            return {"error": "Insufficient FRED Fed rate data"}

        actual   = float(obs[0]["value"])
        previous = float(obs[1]["value"])

        return {
            "indicator": "Fed Interest Rate",
            "actual":    actual,
            "previous":  previous,
            "forecast":  None,
            "period":    obs[0]["date"],
            "unit":      "%",
            "source":    "Federal Reserve (FRED)",
            "series_id": FRED_SERIES["FedRate"],
        }

    def get_ppi(self) -> Dict:
        """PPI m/m from FRED (cross-check source)."""
        obs = self._fetch(FRED_SERIES["PPI"], limit=5)
        if len(obs) < 3:
            return {"error": "Insufficient FRED PPI data"}

        idx0 = float(obs[0]["value"])
        idx1 = float(obs[1]["value"])
        idx2 = float(obs[2]["value"])

        actual_mom = _calc_mom(idx0, idx1)
        prev_mom   = _calc_mom(idx1, idx2)

        return {
            "indicator": "PPI m/m",
            "actual":    actual_mom,
            "previous":  prev_mom,
            "forecast":  None,
            "period":    obs[0]["date"],
            "unit":      "%",
            "source":    "FRED",
            "series_id": FRED_SERIES["PPI"],
        }

    def get_retail_sales(self) -> Dict:
        """Retail Sales m/m from FRED RSAFS."""
        obs = self._fetch(FRED_SERIES["RetailSales"], limit=5)
        if len(obs) < 3:
            return {"error": "Insufficient FRED Retail Sales data"}

        val0 = float(obs[0]["value"])
        val1 = float(obs[1]["value"])
        val2 = float(obs[2]["value"])

        actual_mom = _calc_mom(val0, val1)
        prev_mom   = _calc_mom(val1, val2)

        return {
            "indicator": "Retail Sales m/m",
            "actual":    actual_mom,
            "previous":  prev_mom,
            "forecast":  None,
            "period":    obs[0]["date"],
            "unit":      "%",
            "source":    "Census Bureau (FRED)",
            "series_id": FRED_SERIES["RetailSales"],
        }


# ---------------------------------------------------------------------------
# Trading Economics Fetcher (optional — forecasts only)
# ---------------------------------------------------------------------------

class TEFetcher:
    """
    Optional source for analyst consensus forecasts.
    Only active when TRADING_ECONOMICS_KEY is set in .env.
    If unavailable, all forecasts return None and the UI shows 'N/A'.
    """

    BASE_URL = "https://api.tradingeconomics.com/calendar/country/united+states"

    # Map canonical indicator keys → substrings expected in TE 'Category' field
    INDICATOR_MAP = {
        "CPI":          ["cpi", "consumer price"],
        "PPI":          ["ppi", "producer price"],
        "Unemployment": ["unemployment rate"],
        "FedRate":      ["fed funds", "interest rate", "fomc"],
        "RetailSales":  ["retail sales"],
    }

    def __init__(self):
        self.available = bool(TRADING_ECONOMICS_KEY)

    def get_forecasts(self) -> Dict[str, Optional[float]]:
        """
        Returns a dict like:
            {
              "CPI":          0.2,
              "PPI":          0.1,
              "Unemployment": 4.1,
              "FedRate":      5.25,
              "RetailSales":  0.2,
            }
        Values that cannot be found return None.
        """
        if not self.available:
            return {k: None for k in self.INDICATOR_MAP}

        cache_key = "te_forecasts_us"
        cached = get_cached(cache_key)
        if cached is not None:
            return cached

        try:
            resp = requests.get(
                self.BASE_URL,
                params={"c": TRADING_ECONOMICS_KEY},
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            events = resp.json()
        except (requests.RequestException, json.JSONDecodeError) as exc:
            logger.warning("Trading Economics fetch failed: %s", exc)
            return {k: None for k in self.INDICATOR_MAP}

        if not isinstance(events, list):
            return {k: None for k in self.INDICATOR_MAP}

        # Pick the most-recently-scheduled event per indicator
        forecasts: Dict[str, Optional[float]] = {k: None for k in self.INDICATOR_MAP}
        now = datetime.utcnow()

        for event in events:
            category = (event.get("Category") or event.get("Event") or "").lower()
            forecast_val = event.get("Forecast") or event.get("TEForecast")

            for key, keywords in self.INDICATOR_MAP.items():
                if forecasts[key] is not None:
                    continue
                if any(kw in category for kw in keywords):
                    try:
                        if forecast_val not in (None, ""):
                            forecasts[key] = float(str(forecast_val).replace("%", ""))
                    except (ValueError, TypeError):
                        pass

        # Cache for 6 hours since forecasts don't change minute-to-minute
        set_cached(cache_key, forecasts, ttl=21600)
        return forecasts
