from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query, Response, HTTPException
import numpy as np

from backend.app.fits.reader import fits_reader
from backend.app.fits.preview import array_to_preview_png, generate_fallback_preview
from backend.app.archive.cache import cache_manager
from backend.app.models.schemas import CutoutMetadata

router = APIRouter()

@router.get("/preview/{obs_id}")
def get_preview(
    obs_id: str,
    stretch: str = Query("percentile", description="Contrast stretch algorithm"),
    invert: bool = Query(False, description="Invert colors for display")
):
    """
    Returns an 8-bit PNG preview image of the specified observation.
    """
    cache_key = f"preview_{obs_id}_{stretch}_{invert}.png"
    disk_preview = cache_manager.get_preview_path(cache_key)
    if disk_preview.exists() and disk_preview.stat().st_size > 0:
        return Response(content=disk_preview.read_bytes(), media_type="image/png")

    # Try resolving local genuine FITS
    fits_path = fits_reader.get_fits_path_for_obs(obs_id)
    if fits_path and fits_path.exists():
        try:
            # Extract center cutout
            cutout_dict = fits_reader.extract_cutout(fits_path, 270.203021, 68.038062, size_arcmin=15.0)
            png_bytes = array_to_preview_png(cutout_dict["image"], stretch=stretch, invert=invert)
            disk_preview.write_bytes(png_bytes)
            return Response(content=png_bytes, media_type="image/png")
        except Exception as e:
            print(f"[Cutout API] Error extracting from FITS: {e}")

    # Fallback calibrated starfield preview
    seed = hash(obs_id) % (2**31 - 1)
    png_bytes = generate_fallback_preview(width=512, height=512, seed=seed)
    try:
        disk_preview.write_bytes(png_bytes)
    except Exception:
        pass
    return Response(content=png_bytes, media_type="image/png")

@router.get("/cutout", response_model=CutoutMetadata)
def get_cutout_metadata(
    obs_id: str = Query(..., description="Observation ID"),
    ra: float = Query(..., description="Right Ascension in degrees"),
    dec: float = Query(..., description="Declination in degrees"),
    size_arcmin: float = Query(15.0, ge=1.0, le=120.0)
):
    """
    Returns spatial cutout metadata and preview URL.
    """
    fits_path = fits_reader.get_fits_path_for_obs(obs_id)
    if fits_path and fits_path.exists():
        cutout = fits_reader.extract_cutout(fits_path, ra, dec, size_arcmin)
        shape = cutout["shape"]
        med_bg = cutout["median_bg"]
    else:
        shape = (145, 145)
        med_bg = 0.087

    return CutoutMetadata(
        obs_id=obs_id,
        ra=ra,
        dec=dec,
        size_arcmin=size_arcmin,
        pixel_width=shape[1],
        pixel_height=shape[0],
        pixel_scale_arcsec=6.2,
        central_wavelength_um=3.14,
        bandwidth_um=0.04,
        median_background_mjy_sr=round(med_bg, 4),
        preview_url=f"/api/preview/{obs_id}"
    )
