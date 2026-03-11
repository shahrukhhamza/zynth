"""
validator.py — Cross-source verification.

Compares BLS and FRED values for the same indicator.  When a discrepancy
exceeds the configured threshold the record is flagged so gemini_reasoning
can investigate.  The "canonical" value always comes from the government's
primary reporting agency:

    CPI / PPI / Unemployment  →  BLS is authoritative
    Fed Rate / Retail Sales   →  FRED / Federal Reserve is authoritative
"""

import logging
from typing import Any, Dict, List, Optional

from config import DISCREPANCY_THRESHOLD

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result dataclass (plain dict for simplicity)
# ---------------------------------------------------------------------------

def _make_record(
    indicator: str,
    actual: Optional[float],
    previous: Optional[float],
    forecast: Optional[float],
    unit: str,
    source: str,
    period: str,
    verified: bool,
    discrepancy: Optional[float] = None,
    discrepancy_flagged: bool = False,
    bls_value: Optional[float] = None,
    fred_value: Optional[float] = None,
    series_id: str = "",
) -> Dict:
    return {
        "indicator":           indicator,
        "actual":              actual,
        "previous":            previous,
        "forecast":            forecast,
        "unit":                unit,
        "source":              source,
        "period":              period,
        "verified":            verified,
        "discrepancy":         discrepancy,
        "discrepancy_flagged": discrepancy_flagged,
        "bls_value":           bls_value,
        "fred_value":          fred_value,
        "series_id":           series_id,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _compare(
    bls_data: Dict,
    fred_data: Dict,
    prefer: str = "bls",
) -> Dict:
    """
    Compare two source dicts for the same indicator.

    Returns a merged record.  `prefer` controls which source's value becomes
    'actual' (either 'bls' or 'fred').
    """
    bls_ok  = "error" not in bls_data  and bls_data.get("actual") is not None
    fred_ok = "error" not in fred_data and fred_data.get("actual") is not None

    if bls_ok and fred_ok:
        bls_val  = bls_data["actual"]
        fred_val = fred_data["actual"]
        diff     = abs(bls_val - fred_val)
        flagged  = diff > DISCREPANCY_THRESHOLD

        if flagged:
            logger.warning(
                "Discrepancy in %s: BLS=%.4f  FRED=%.4f  diff=%.4f",
                bls_data.get("indicator", "?"),
                bls_val,
                fred_val,
                diff,
            )

        primary = bls_data if prefer == "bls" else fred_data
        return _make_record(
            indicator           = primary["indicator"],
            actual              = primary["actual"],
            previous            = primary.get("previous"),
            forecast            = primary.get("forecast"),
            unit                = primary.get("unit", "%"),
            source              = primary.get("source", ""),
            period              = primary.get("period", ""),
            verified            = True,
            discrepancy         = round(diff, 4),
            discrepancy_flagged = flagged,
            bls_value           = bls_val,
            fred_value          = fred_val,
            series_id           = primary.get("series_id", ""),
        )

    # Only one source available — unverified
    if bls_ok:
        d = bls_data
    elif fred_ok:
        d = fred_data
    else:
        # Both failed
        name = (
            bls_data.get("indicator") or
            fred_data.get("indicator") or
            "Unknown"
        )
        logger.error("Both BLS and FRED failed for indicator: %s", name)
        return _make_record(
            indicator = name,
            actual    = None,
            previous  = None,
            forecast  = None,
            unit      = "%",
            source    = "N/A",
            period    = "N/A",
            verified  = False,
        )

    return _make_record(
        indicator           = d["indicator"],
        actual              = d.get("actual"),
        previous            = d.get("previous"),
        forecast            = d.get("forecast"),
        unit                = d.get("unit", "%"),
        source              = d.get("source", ""),
        period              = d.get("period", ""),
        verified            = False,  # only one source — can't cross-check
        discrepancy         = None,
        discrepancy_flagged = False,
        series_id           = d.get("series_id", ""),
    )


def _fred_only(fred_data: Dict) -> Dict:
    """For indicators that only come from FRED (e.g. Fed Rate, Retail Sales)."""
    if "error" in fred_data or fred_data.get("actual") is None:
        name = fred_data.get("indicator", "Unknown")
        logger.error("FRED-only fetch failed for: %s", name)
        return _make_record(
            indicator = name,
            actual    = None,
            previous  = None,
            forecast  = None,
            unit      = "%",
            source    = "N/A",
            period    = "N/A",
            verified  = False,
        )

    return _make_record(
        indicator = fred_data["indicator"],
        actual    = fred_data.get("actual"),
        previous  = fred_data.get("previous"),
        forecast  = fred_data.get("forecast"),
        unit      = fred_data.get("unit", "%"),
        source    = fred_data.get("source", "FRED"),
        period    = fred_data.get("period", ""),
        verified  = False,  # single source
        series_id = fred_data.get("series_id", ""),
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def validate_and_merge(
    bls_cpi:         Dict,
    fred_cpi:        Dict,
    bls_ppi:         Dict,
    fred_ppi:        Dict,
    bls_unemployment: Dict,
    fred_unemployment: Dict,
    fred_fed_rate:   Dict,
    fred_retail:     Dict,
    forecasts:       Dict,
) -> List[Dict]:
    """
    Merge all raw source dicts into a canonical list of indicator records.

    Injects analyst forecast values (from Trading Economics or None) and
    flags any cross-source discrepancies for Gemini review.

    Returns a list ordered for display:
        CPI m/m, PPI m/m, Unemployment Rate, Fed Interest Rate, Retail Sales m/m
    """
    records: List[Dict] = []

    # --- CPI m/m (BLS primary, FRED cross-check) ---
    cpi = _compare(bls_cpi, fred_cpi, prefer="bls")
    cpi["forecast"] = forecasts.get("CPI")
    records.append(cpi)

    # --- PPI m/m (BLS primary, FRED cross-check) ---
    ppi = _compare(bls_ppi, fred_ppi, prefer="bls")
    ppi["forecast"] = forecasts.get("PPI")
    records.append(ppi)

    # --- Unemployment Rate (BLS primary, FRED cross-check) ---
    unemp = _compare(bls_unemployment, fred_unemployment, prefer="bls")
    unemp["forecast"] = forecasts.get("Unemployment")
    records.append(unemp)

    # --- Fed Interest Rate (FRED / Federal Reserve only) ---
    fed = _fred_only(fred_fed_rate)
    fed["forecast"] = forecasts.get("FedRate")
    records.append(fed)

    # --- Retail Sales m/m (Census Bureau via FRED) ---
    retail = _fred_only(fred_retail)
    retail["forecast"] = forecasts.get("RetailSales")
    records.append(retail)

    return records


def get_flagged(records: List[Dict]) -> List[Dict]:
    """Return only records that have a cross-source discrepancy above threshold."""
    return [r for r in records if r.get("discrepancy_flagged")]
