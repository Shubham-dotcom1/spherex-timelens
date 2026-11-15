from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class TargetPreset(BaseModel):
    id: str
    name: str
    ra_deg: float
    dec_deg: float
    ra: float = 0.0
    dec: float = 0.0
    ra_sexagesimal: str = ""
    dec_sexagesimal: str = ""
    category: str = "benchmark"
    description: str = ""
    purpose: str = ""
    scientific_context: str = ""
    expected_feature: str = ""
    pm_ra_mas_yr: float = 0.0
    pm_dec_mas_yr: float = 0.0
    epoch: float = 2000.0
    status: str
    observation_count: int
    bands: List[str] = Field(default_factory=list)
    mjd_min: Optional[float] = None
    mjd_max: Optional[float] = None
    notes: str = ""

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
    annulus_inner_arcsec: Optional[float] = Field(12.4, ge=4.0, le=120.0)
    annulus_outer_arcsec: Optional[float] = Field(24.8, ge=6.0, le=180.0)
    inner_annulus_arcsec: Optional[float] = None
    outer_annulus_arcsec: Optional[float] = None

class PhotometryResult(BaseModel):
    obs_id: str
    ra: float
    dec: float
    mjd: float = 60789.879611
    wavelength_um: float = 3.1415
    flux_mjy: float
    flux_err_mjy: float
    snr: float
    background_mjy_sr: float = 0.088
    background_level: float = 0.088
    quality_flag: int = 0
    aperture_radius_arcsec: float = 6.2
    validation_status: str = "SUPPORTED"
    notes: str = ""

class DifferenceRequest(BaseModel):
    obs_id_a: Optional[str] = None
    obs_id_b: Optional[str] = None
    reference_obs_id: Optional[str] = None
    target_obs_id: Optional[str] = None
    ra: float
    dec: float
    size_arcmin: float = 15.0
    box_size_pixels: Optional[int] = 512
    detection_threshold_sigma: Optional[float] = 5.0

class DifferenceResult(BaseModel):
    obs_id_a: str = ""
    obs_id_b: str = ""
    reference_obs_id: str = ""
    target_obs_id: str = ""
    epoch_a_mjd: float = 60789.879611
    epoch_b_mjd: float = 60796.124500
    reference_mjd: float = 60789.879611
    target_mjd: float = 60796.124500
    delta_days: float = 6.24
    delta_time_days: float = 6.24
    central_wavelength_um: float = 3.1415
    difference_preview_url: str = ""
    significance_preview_url: str = ""
    diff_preview_url: str = ""
    max_significance_sigma: float = 2.1
    max_abs_residual: float = 0.12
    rms_residual: float = 0.045
    residual_flux_mjy: float = 0.12
    chi2_nu: float = 1.05
    detected_transients_count: int = 0
    false_positive_rate_estimate: float = 0.001
    status: str = "SUPPORTED"
    validation_status: str = "SUPPORTED"
    notes: str = ""

class ValidationResult(BaseModel):
    hypothesis_id: str
    hypothesis_name: str
    target_name: Optional[str] = None
    status: str  # SUPPORTED, REJECTED, CANDIDATE_DETECTION, NON_DETECTION, INCONCLUSIVE, INSUFFICIENT_COVERAGE
    details: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    provenance: Dict[str, Any] = Field(default_factory=dict)

class InjectionRequest(BaseModel):
    obs_id: str = "sample_level2_1D4"
    ra: float
    dec: float
    injection_type: str = "planet_x"  # planet_x, asteroid, transient, brown_dwarf
    flux_mjy: float = Field(2.5, ge=0.1, le=500.0)
    motion_arcsec_day: float = Field(1.5, ge=0.0, le=120.0)
    position_angle_deg: float = Field(45.0, ge=0.0, le=360.0)

class InjectionResult(BaseModel):
    obs_id: str
    injected_obs_id: str
    injection_type: str
    target_ra: float
    target_dec: float
    injected_flux_mjy: float
    motion_arcsec_day: float
    simulated_delta_days: float = 6.24
    injected_preview_url: str
    status: str = "INJECTED"
    notes: str = ""

class SedTemplateMatch(BaseModel):
    template_id: str
    template_name: str
    description: str
    reduced_chi2: float
    p_value: float
    is_best_fit: bool
    diagnostic_features: List[str] = Field(default_factory=list)
    model_curve: List[Dict[str, float]] = Field(default_factory=list)

class CatalogMatchResult(BaseModel):
    ra: float
    dec: float
    gaia_match: Optional[Dict[str, Any]] = None
    mpc_asteroid_match: Optional[Dict[str, Any]] = None
    is_known_object: bool = False
    classification: str = "UNCATALOGED_CANDIDATE"
    notes: str = ""

class StackRequest(BaseModel):
    obs_ids: List[str]
    ra: float
    dec: float
    size_arcmin: float = 15.0
    method: str = "median"  # median or mean

class StackResult(BaseModel):
    n_epochs_coadded: int
    method: str
    snr_gain_factor: float
    input_rms_mjy_sr: float
    stacked_rms_mjy_sr: float
    noise_reduction_pct: float
    stacked_preview_url: str
    status: str
    notes: str

class MotionTrackRequest(BaseModel):
    ra_deg: float
    dec_deg: float
    target_name: Optional[str] = "Moving Target"
    pm_ra_mas_yr: float = 0.0
    pm_dec_mas_yr: float = 0.0
    orbital_rate_arcsec_day: Optional[float] = None
    position_angle_deg: float = 45.0
    baseline_days: float = 183.0

class MotionTrackResult(BaseModel):
    target_coords: Dict[str, float]
    baseline_days: float
    rate_source: str
    daily_rate_arcsec_day: float
    position_angle_deg: float
    total_displacement_arcsec: float
    total_displacement_pixels: float
    centroid_uncertainty_arcsec: float
    significance_sigma: float
    validation_status: str
    verdict: str
    trajectory: List[Dict[str, Any]]

class MovingObjectBenchmark(BaseModel):
    id: str
    name: str
    designation: str
    classification: str
    ra_deg: float
    dec_deg: float
    pm_ra_mas_yr: float
    pm_dec_mas_yr: float
    orbital_rate_arcsec_day: float
    h_mag: float
    spectral_class: str
    scientific_context: str
    expected_motion_note: str

class FieldCatalogSource(BaseModel):
    source_id: str
    catalog: str  # Gaia DR3, MPC, 2MASS
    ra_deg: float
    dec_deg: float
    pixel_x: float
    pixel_y: float
    mag: float
    mag_band: str
    proper_motion: Optional[Dict[str, float]] = None
    designation: Optional[str] = None
