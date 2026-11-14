import os
import json
import time
import threading
from pathlib import Path
from collections import OrderedDict
from typing import Optional, Any, Dict

CACHE_DIR = Path("cache")
FITS_CACHE_DIR = CACHE_DIR / "fits"
PREVIEW_CACHE_DIR = CACHE_DIR / "previews"
METADATA_CACHE_DIR = CACHE_DIR / "metadata"

for d in [FITS_CACHE_DIR, PREVIEW_CACHE_DIR, METADATA_CACHE_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class TieredCacheManager:
    """Thread-safe multi-tier in-memory and disk cache."""
    def __init__(self, max_memory_entries: int = 500, default_ttl_sec: float = 3600.0):
        self.lock = threading.Lock()
        self.max_memory_entries = max_memory_entries
        self.default_ttl_sec = default_ttl_sec
        self._memory_cache: OrderedDict[str, Tuple[float, Any]] = OrderedDict()

    def get_memory(self, key: str) -> Optional[Any]:
        with self.lock:
            entry = self._memory_cache.get(key)
            if not entry:
                return None
            expiry, val = entry
            if time.time() > expiry:
                self._memory_cache.pop(key, None)
                return None
            self._memory_cache.move_to_end(key)
            return val

    def set_memory(self, key: str, val: Any, ttl_sec: Optional[float] = None) -> None:
        ttl = ttl_sec or self.default_ttl_sec
        with self.lock:
            if key in self._memory_cache:
                self._memory_cache.pop(key)
            self._memory_cache[key] = (time.time() + ttl, val)
            while len(self._memory_cache) > self.max_memory_entries:
                self._memory_cache.popitem(last=False)

    def get_metadata(self, key: str) -> Optional[Dict[str, Any]]:
        mem = self.get_memory(f"meta:{key}")
        if mem is not None:
            return mem
        
        # Disk fallback
        path = METADATA_CACHE_DIR / f"{key}.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.set_memory(f"meta:{key}", data)
                return data
            except Exception:
                pass
        return None

    def set_metadata(self, key: str, data: Dict[str, Any]) -> None:
        self.set_memory(f"meta:{key}", data)
        path = METADATA_CACHE_DIR / f"{key}.json"
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass

    def get_fits_path(self, filename: str) -> Optional[Path]:
        # Check cache/fits first
        p = FITS_CACHE_DIR / filename
        if p.exists() and p.stat().st_size > 0:
            return p
        # Check research/feasibility for local downloaded files
        feasibility_p = Path("research/feasibility") / filename
        if feasibility_p.exists() and feasibility_p.stat().st_size > 0:
            return feasibility_p
        return None

    def get_preview_path(self, filename: str) -> Path:
        return PREVIEW_CACHE_DIR / filename

cache_manager = TieredCacheManager()
