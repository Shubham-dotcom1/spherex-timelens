from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.routes import api_router
from backend.app.spectroscopy.wave_calibrator import wave_calibrator

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load local genuine SPHEREx FITS product if available
    local_fits = Path("research/feasibility/sample_level2_1D4.fits")
    if local_fits.exists():
        try:
            wave_calibrator.load_fits(local_fits)
            print(f"[Lifespan] Loaded WCS-WAVE calibrator from {local_fits}")
        except Exception as e:
            print(f"[Lifespan] Notice: Could not load WCS-WAVE on startup: {e}")
    yield
    # Shutdown

app = FastAPI(
    title="SPHEREx TimeLens API",
    description="Scientific astronomical backend for exploring multi-epoch SPHEREx mission data.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for local frontend development and production hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "project": "SPHEREx TimeLens",
        "team": "CodeGenesis",
        "docs_url": "/docs",
        "api_health": "/api/health",
        "status": "ONLINE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
