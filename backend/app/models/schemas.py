from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class TargetPreset(BaseModel):
    id: str
    name: str
    ra_deg: float
    dec_deg: float
    purpose: str
    status: str
    observation_count: int
    bands: List[str] = Field(default_factory=list)
    mjd_min: Optional[float] = None
    mjd_max: Optional[float] = None
    notes: str

class CoordinateQuery(BaseModel):
    ra: float = Field(..., ge=0.0, le=360.0, description="Right Ascension in ICRS degrees")
    dec: float = Field(..., ge=-90.0, le=90.0, description="Declination in ICRS degrees")
    radius_deg: float = Field(0.25, ge=0.01, le=5.0, description="Search radius in degrees")
    band: Optional[str] = Field(None, description="SPHEREx band filter (e.g. SPHEREx-D1, SPHEREx-D4)")

class ObservationRecord(BaseModel):
    obs_id: str
    product_id: str
    uri: str
    datarelease: str = "dr1"
    detector: int
    band: str
    wavelength_min_um: float
    wavelength_max_um: float
    mjd: float
    obs_date: str
    ra: float
    dec: float
    has_local_file: bool = False
    preview_url: Optional[str] = None
    status: str = "AVAILABLE"

class CutoutRequest(BaseModel):
    uri: Optional[str] = None
    obs_id: Optional[str] = None
    ra: float
    dec: float
    size_arcmin: float = Field(15.0, ge=1.0, le=120.0)
    stretch: str = Field("percentile", description="Contrast stretch algorithm: percentile, asinh, linear")

class CutoutMetadata(BaseModel):
    obs_id: str
    ra: float
    dec: float
    size_arcmin: float
    pixel_width: int
    pixel_height: int
    pixel_scale_arcsec: float
    central_wavelength_um: float
    bandwidth_um: float
    median_background_mjy_sr: float
    preview_url: str

class PhotometryRequest(BaseModel):
    obs_id: str
    ra: float
    dec: float
    aperture_radius_arcsec: float = Field(6.2, ge=2.0, le=60.0)
    annulus_inner_arcsec: float = Field(12.4, ge=4.0, le=120.0)
    annulus_outer_arcsec: float = Field(24.8, ge=6.0, le=180.0)

class PhotometryResult(BaseModel):
    obs_id: str
    ra: float
    dec: float
    mjd: float
    wavelength_um: float
    flux_mjy: float
    flux_err_mjy: float
    snr: float
    background_mjy_sr: float
    quality_flag: int
    validation_status: str

class DifferenceRequest(BaseModel):
    obs_id_a: str
    obs_id_b: str
    ra: float
    dec: float
    size_arcmin: float = 15.0

class DifferenceResult(BaseModel):
    obs_id_a: str
    obs_id_b: str
    epoch_a_mjd: float
    epoch_b_mjd: float
    delta_days: float
    central_wavelength_um: float
    difference_preview_url: str
    significance_preview_url: str
    max_significance_sigma: float
    residual_flux_mjy: float
    status: str

class ValidationResult(BaseModel):
    hypothesis_id: str
    hypothesis_name: str
    target_name: Optional[str] = None
    status: str  # SUPPORTED, REJECTED, CANDIDATE_DETECTION, NON_DETECTION, INCONCLUSIVE, INSUFFICIENT_COVERAGE
    details: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    provenance: Dict[str, Any] = Field(default_factory=dict)
