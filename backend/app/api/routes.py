from fastapi import APIRouter
from backend.app.api.health import router as health_router
from backend.app.api.targets import router as targets_router
from backend.app.api.observations import router as obs_router
from backend.app.api.cutout import router as cutout_router
from backend.app.api.analysis import router as analysis_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(targets_router, tags=["Targets"])
api_router.include_router(obs_router, tags=["Observations"])
api_router.include_router(cutout_router, tags=["Cutout & Previews"])
api_router.include_router(analysis_router, tags=["Scientific Analysis"])
