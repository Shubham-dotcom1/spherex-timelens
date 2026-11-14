from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.models.schemas import ObservationRecord
from backend.app.archive.irsa_client import irsa_client
from backend.app.astrometry.coords import parse_coordinate_string

router = APIRouter()

@router.get("/observations", response_model=List[ObservationRecord])
def search_observations(
    ra: Optional[float] = Query(None, ge=0.0, le=360.0, description="Right ascension in degrees (0 to 360)"),
    dec: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Declination in degrees (-90 to +90)"),
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
            if not (0.0 <= ra_parsed <= 360.0):
                raise HTTPException(status_code=422, detail="RA must be between 0 and 360 degrees.")
            if not (-90.0 <= dec_parsed <= 90.0):
                raise HTTPException(status_code=422, detail="Dec must be between -90 and 90 degrees.")
            ra = ra_parsed
            dec = dec_parsed
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif ra is None or dec is None:
        raise HTTPException(status_code=400, detail="Must provide either (ra and dec) or 'coords' string.")

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
