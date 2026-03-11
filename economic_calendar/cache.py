"""
cache.py — Simple JSON-based response cache with TTL.
Avoids hammering APIs on repeated runs within the same refresh window.
"""

import json
import time
import hashlib
import logging
from pathlib import Path
from typing import Any, Optional

from config import CACHE_DIR, CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)


def _cache_path(key: str) -> Path:
    safe = hashlib.md5(key.encode()).hexdigest()
    return CACHE_DIR / f"{safe}.json"


def get(key: str) -> Optional[Any]:
    path = _cache_path(key)
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            entry = json.load(f)
        age = time.time() - entry.get("cached_at", 0)
        ttl  = entry.get("ttl", CACHE_TTL_SECONDS)
        if age > ttl:
            logger.debug(f"Cache expired for key={key} (age={age:.0f}s)")
            path.unlink(missing_ok=True)
            return None
        logger.debug(f"Cache hit for key={key} (age={age:.0f}s)")
        return entry["data"]
    except Exception as e:
        logger.warning(f"Cache read error for key={key}: {e}")
        return None


def set(key: str, data: Any, ttl: int = CACHE_TTL_SECONDS) -> None:
    path = _cache_path(key)
    try:
        entry = {"cached_at": time.time(), "ttl": ttl, "data": data}
        with open(path, "w", encoding="utf-8") as f:
            json.dump(entry, f, indent=2, default=str)
        logger.debug(f"Cached key={key}")
    except Exception as e:
        logger.warning(f"Cache write error for key={key}: {e}")


def invalidate(key: str) -> None:
    _cache_path(key).unlink(missing_ok=True)


def clear_all() -> int:
    """Delete all cached entries and return the count removed."""
    count = 0
    for f in CACHE_DIR.glob("*.json"):
        f.unlink(missing_ok=True)
        count += 1
    return count
    logger.info("Cache cleared.")
