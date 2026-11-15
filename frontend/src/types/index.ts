export interface TargetPreset {
  id: string;
  name: string;
  description?: string;
  category: 'astrometry' | 'brown-dwarf' | 'variable' | 'benchmark' | string;
  ra: number;
  dec: number;
  ra_deg?: number;
  dec_deg?: number;
  ra_sexagesimal?: string;
  dec_sexagesimal?: string;
  pm_ra_mas_yr?: number;
  pm_dec_mas_yr?: number;
  epoch?: number;
  expected_feature?: string;
  scientific_context?: string;
  purpose?: string;
  status: 'VERIFIED' | 'INSUFFICIENT_COVERAGE' | string;
  observation_count: number;
}

export interface ObservationRecord {
  obs_id: string;
  product_id: string;
  uri: string;
  datarelease: string;
  detector: number;
  band: string;
  wavelength_min_um: number;
  wavelength_max_um: number;
  mjd: number;
  obs_date: string;
  ra: number;
  dec: number;
  has_local_file: boolean;
  preview_url: string;
  status: 'AVAILABLE' | 'ARCHIVED' | 'DOWNLOADING';
}

export interface PhotometryResult {
  obs_id: string;
  ra: number;
  dec: number;
  flux_mjy: number;
  flux_err_mjy: number;
  snr: number;
  background_level: number;
  aperture_radius_arcsec: number;
  validation_status: 'SUPPORTED' | 'CANDIDATE_DETECTION' | 'NON_DETECTION' | 'INCONCLUSIVE';
  notes: string;
}

export interface DifferenceResult {
  reference_obs_id: string;
  target_obs_id: string;
  reference_mjd: number;
  target_mjd: number;
  delta_time_days: number;
  diff_preview_url: string;
  significance_preview_url: string;
  max_abs_residual: number;
  rms_residual: number;
  chi2_nu: number;
  detected_transients_count: number;
  false_positive_rate_estimate: number;
  validation_status: 'SUPPORTED' | 'REJECTED' | 'INCONCLUSIVE';
  notes: string;
}

export interface SpectrumPoint {
  band_name: string;
  detector: number;
  wavelength_um: number;
  delta_lambda_um: number;
  flux_mjy: number;
  flux_err_mjy: number;
  quality_flag: number;
}

export interface SpectrumResult {
  ra: number;
  dec: number;
  points: SpectrumPoint[];
  validation_status: 'SUPPORTED' | 'INSUFFICIENT_COVERAGE' | 'INCONCLUSIVE';
  notes: string;
}

export interface LightCurvePoint {
  obs_id: string;
  mjd: number;
  obs_date: string;
  band: string;
  flux_mjy: number;
  flux_err_mjy: number;
  snr: number;
}

export interface LightCurveResult {
  target_name: string;
  ra: number;
  dec: number;
  band: string;
  points: LightCurvePoint[];
  is_variable: boolean;
  p_value_constant: number;
  variability_index: number;
  validation_status: 'SUPPORTED' | 'REJECTED' | 'INCONCLUSIVE' | 'INSUFFICIENT_DATA';
  notes: string;
}

export interface HypothesisValidation {
  hypothesis_id: string;
  title: string;
  statement: string;
  test_criteria: string;
  evidence: Record<string, any>;
  outcome: 'SUPPORTED' | 'REJECTED' | 'CANDIDATE_DETECTION' | 'NON_DETECTION' | 'INCONCLUSIVE' | 'INSUFFICIENT_DATA';
  reproducibility: {
    protocol_version: string;
    timestamp: string;
    dataset_version: string;
    hash?: string;
  };
  notes: string;
}

export interface PopperianReport {
  target_name: string;
  coordinates: {
    ra: number;
    dec: number;
    ra_sexagesimal: string;
    dec_sexagesimal: string;
  };
  hypotheses: {
    h1_observation_availability: HypothesisValidation;
    h2_moving_object: HypothesisValidation;
    h3_difference_imaging: HypothesisValidation;
    h4_variability: HypothesisValidation;
  };
  overall_summary: string;
  recommendation: string;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  team: string;
  challenge: string;
  archive_status: string;
  cached_exposures: number;
  sample_fits_available: boolean;
}

export interface InjectionRequest {
  obs_id: string;
  ra: number;
  dec: number;
  injection_type: 'planet_x' | 'asteroid' | 'transient' | 'brown_dwarf';
  flux_mjy: number;
  motion_arcsec_day: number;
  position_angle_deg: number;
}

export interface InjectionResult {
  obs_id: string;
  injected_obs_id: string;
  injection_type: string;
  target_ra: number;
  target_dec: number;
  injected_flux_mjy: number;
  motion_arcsec_day: number;
  simulated_delta_days: number;
  injected_preview_url: string;
  status: 'RECOVERED_CANDIDATE' | 'MARGINAL_CANDIDATE_3_SIGMA' | 'BELOW_DETECTION_LIMIT';
  notes: string;
}

export interface SedTemplateMatch {
  template_id: string;
  template_name: string;
  description: string;
  reduced_chi2: number;
  p_value: number;
  is_best_fit: boolean;
  diagnostic_features: string[];
  model_curve: Array<{ wavelength_um: number; flux_mjy: number }>;
}

export interface GaiaMatch {
  source_id: string;
  designation?: string;
  g_mag: number;
  bp_rp?: number;
  pm_ra_mas_yr?: number;
  pm_dec_mas_yr?: number;
  parallax_mas?: number;
  distance_pc?: number;
  spectral_type?: string;
  variable_type?: string;
  teff_k?: number;
}

export interface MpcAsteroidMatch {
  designation: string;
  catalog: string;
  orbit_type: string;
  semi_major_axis_au: number;
  perihelion_au: number;
  eccentricity: number;
  inclination_deg: number;
  apparent_magnitude_v: number;
  predicted_motion_arcsec_day: number;
}

export interface CatalogMatchResult {
  ra: number;
  dec: number;
  gaia_match: GaiaMatch | null;
  mpc_asteroid_match: MpcAsteroidMatch | null;
  is_known_object: boolean;
  classification: string;
  notes: string;
}

export interface AuditCertificate {
  certificate_id: string;
  sha256_checksum: string;
  issued_at_utc: string;
  methodology: string;
  target: {
    name: string;
    ra_deg: number;
    dec_deg: number;
  };
  hypotheses_evaluated: Array<{
    hypothesis: string;
    test: string;
    verdict: string;
  }>;
  verdict: 'SCIENTIFICALLY_VERIFIED' | 'CANDIDATE_UNDER_INVESTIGATION' | 'FALSIFIED_NULL_RETAINED';
  instrument: string;
  archive: string;
  team: string;
}

export interface StackRequest {
  obs_ids: string[];
  ra: number;
  dec: number;
  size_arcmin?: number;
  method: 'median' | 'mean';
}

export interface StackResult {
  n_epochs_coadded: number;
  method: string;
  snr_gain_factor: number;
  input_rms_mjy_sr: number;
  stacked_rms_mjy_sr: number;
  noise_reduction_pct: number;
  stacked_preview_url: string;
  status: string;
  notes: string;
}

export interface MotionTrajectoryStep {
  step: number;
  day: number;
  ra_deg: number;
  dec_deg: number;
  displacement_arcsec: number;
  dx_pixels: number;
  dy_pixels: number;
}

export interface MotionTrackRequest {
  ra_deg: number;
  dec_deg: number;
  target_name?: string;
  pm_ra_mas_yr?: number;
  pm_dec_mas_yr?: number;
  orbital_rate_arcsec_day?: number;
  position_angle_deg?: number;
  baseline_days?: number;
}

export interface MotionTrackResult {
  target_coords: { ra_deg: number; dec_deg: number };
  baseline_days: number;
  rate_source: string;
  daily_rate_arcsec_day: number;
  position_angle_deg: number;
  total_displacement_arcsec: number;
  total_displacement_pixels: number;
  centroid_uncertainty_arcsec: number;
  significance_sigma: number;
  validation_status: 'SUPPORTED' | 'CANDIDATE_DETECTION' | 'NON_DETECTION';
  verdict: string;
  trajectory: MotionTrajectoryStep[];
}

export interface MovingObjectBenchmark {
  id: string;
  name: string;
  designation: string;
  classification: string;
  ra_deg: number;
  dec_deg: number;
  pm_ra_mas_yr: number;
  pm_dec_mas_yr: number;
  orbital_rate_arcsec_day: number;
  h_mag: number;
  spectral_class: string;
  scientific_context: string;
  expected_motion_note: string;
}

export interface FieldCatalogSource {
  source_id: string;
  catalog: 'Gaia DR3' | 'MPC' | '2MASS';
  ra_deg: number;
  dec_deg: number;
  pixel_x: number;
  pixel_y: number;
  mag: number;
  mag_band: string;
  proper_motion?: { pm_ra: number; pm_dec: number };
  designation?: string;
}
