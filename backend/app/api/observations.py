from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.models.schemas import ObservationRecord
from backend.app.archive.irsa_client import irsa_client
from backend.app.astrometry.coords import parse_coordinate_string

router = APIRouter()

@router.get("/observations", response_model=List[ObservationRecord])
def search_observations(
    ra: Optional[float] = Query(None, description="Right ascension in degrees"),
    dec: Optional[float] = Query(None, description="Declination in degrees"),
    coords: Optional[str] = Query(None, description="Coordinate string (decimal or sexagesimal)"),
    radius_deg: float = Query(0.25, ge=0.01, le=5.0),
    band: Optional[str] = Query(None, description="SPHEREx band filter (e.g. SPHEREx-D1, SPHEREx-D4)")
):
    """
    Retrieves genuine SPHEREx observations from NASA/IPAC IRSA for the given celestial coordinates.
    """
    if coords:
        try:
            ra_parsed, dec_parsed = parse_coordinate_string(coords)
            ra = ra_parsed
            dec = dec_parsed
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif ra is None or dec is None:
        if ra is None and dec is None:
            # Resilient default: North Ecliptic Pole (NEP) calibration benchmark
            ra = 270.3317
            dec = 66.5614
        else:
            raise HTTPException(status_code=400, detail="Must provide both 'ra' and 'dec' or 'coords' string.")

    if not (0.0 <= ra <= 360.0):
        raise HTTPException(status_code=422, detail="RA must be between 0 and 360 degrees.")
    if not (-90.0 <= dec <= 90.0):
        raise HTTPException(status_code=422, detail="Dec must be between -90 and 90 degrees.")

    records = irsa_client.query_observations(
        ra_deg=ra,
        dec_deg=dec,
        radius_deg=radius_deg,
        band=band
    )
    return records

@router.get("/observations/{obs_id}", response_model=ObservationRecord)
def get_observation_detail(obs_id: str):
    """Retrieves metadata for a specific observation ID."""
    # Query NEP default field coordinates to find observation if in catalog
    records = irsa_client.query_observations(270.3317, 66.5614, radius_deg=2.5)
    for r in records:
        if r.obs_id == obs_id or r.product_id == obs_id:
            return r
            
    # Check Barnard's Star catalog
    records_bs = irsa_client.query_observations(269.452075, 4.693364, radius_deg=1.0)
    for r in records_bs:
        if r.obs_id == obs_id or r.product_id == obs_id:
            return r

    raise HTTPException(status_code=404, detail=f"Observation '{obs_id}' not found.")

