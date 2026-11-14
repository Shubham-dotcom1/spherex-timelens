import time
from fastapi import APIRouter
from backend.app.archive.cache import cache_manager

router = APIRouter()
START_TIME = time.time()

@router.get("/health")
def health_check():
    """Health check endpoint providing system status and cache diagnostics."""
    return {
        "status": "HEALTHY",
        "service": "SPHEREx TimeLens Scientific Backend",
        "version": "1.0.0",
        "team": "CodeGenesis",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "archive_status": "ONLINE",
        "archive_url": "https://irsa.ipac.caltech.edu/TAP",
        "memory_cache_entries": len(cache_manager._memory_cache)
    }
