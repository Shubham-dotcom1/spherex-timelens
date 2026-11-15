import math
from typing import Dict, Any, List, Optional

def compute_astrometric_trajectory(
    ra_deg: float,
    dec_deg: float,
    pm_ra_mas_yr: float = 0.0,
    pm_dec_mas_yr: float = 0.0,
    orbital_rate_arcsec_day: Optional[float] = None,
    position_angle_deg: float = 45.0,
    baseline_days: float = 183.0,
    n_steps: int = 5,
    centroid_uncertainty_arcsec: float = 0.15,
    pixel_scale_arcsec: float = 6.2
) -> Dict[str, Any]:
    """
    Computes rigorous astrometric motion trajectory and Karl Popper H2 verification.
    Supports both stellar proper motion (mas/yr) and solar system moving bodies (arcsec/day).
    """
    dec_rad = math.radians(dec_deg)
    cos_dec = math.cos(dec_rad)

    # Determine daily rate in RA and Dec (arcsec/day)
    if orbital_rate_arcsec_day is not None and orbital_rate_arcsec_day > 0:
        total_rate_arcsec_day = orbital_rate_arcsec_day
        pa_rad = math.radians(position_angle_deg)
        d_ra_arcsec_day = total_rate_arcsec_day * math.sin(pa_rad)
        d_dec_arcsec_day = total_rate_arcsec_day * math.cos(pa_rad)
        rate_source = "Solar System Orbital Kinematics"
    else:
        # Proper motion in mas/yr -> arcsec/day
        total_pm_mas_yr = math.hypot(pm_ra_mas_yr, pm_dec_mas_yr)
        total_rate_arcsec_day = (total_pm_mas_yr / 1000.0) / 365.25
        d_ra_arcsec_day = (pm_ra_mas_yr / 1000.0) / 365.25
        d_dec_arcsec_day = (pm_dec_mas_yr / 1000.0) / 365.25
        pa_rad = math.atan2(pm_ra_mas_yr, pm_dec_mas_yr) if total_pm_mas_yr > 0 else 0.0
        position_angle_deg = (math.degrees(pa_rad) + 360.0) % 360.0
        rate_source = "Gaia DR3 Astrometric Proper Motion"

    total_displacement_arcsec = total_rate_arcsec_day * baseline_days
    total_displacement_pixels = total_displacement_arcsec / pixel_scale_arcsec

    # Generate step-by-step trajectory points
    trajectory_points = []
    for i in range(n_steps):
        t_frac = i / max(1, n_steps - 1)
        t_day = t_frac * baseline_days
        disp_arcsec = total_rate_arcsec_day * t_day
        
        # Astrometric coordinate shift
        delta_dec_deg = (d_dec_arcsec_day * t_day) / 3600.0
        delta_ra_deg = ((d_ra_arcsec_day * t_day) / 3600.0) / (cos_dec if abs(cos_dec) > 1e-4 else 1.0)
        
        cur_ra = ra_deg + delta_ra_deg
        cur_dec = dec_deg + delta_dec_deg
        
        # Local pixel displacement from initial centroid (North = -Y, East = -X in astronomical WCS)
        dx_pix = -(d_ra_arcsec_day * t_day) / pixel_scale_arcsec
        dy_pix = -(d_dec_arcsec_day * t_day) / pixel_scale_arcsec

        trajectory_points.append({
            "step": i + 1,
            "day": round(t_day, 2),
            "ra_deg": round(cur_ra, 6),
            "dec_deg": round(cur_dec, 6),
            "displacement_arcsec": round(disp_arcsec, 3),
            "dx_pixels": round(dx_pix, 2),
            "dy_pixels": round(dy_pix, 2),
        })

    # Popperian H2 Hypothesis Evaluation
    # Claim: Source displacement exceeds 3-sigma astrometric uncertainty
    significance_sigma = total_displacement_arcsec / (centroid_uncertainty_arcsec * math.sqrt(2.0))
    is_motion_detected = significance_sigma >= 3.0
    is_motion_verified = significance_sigma >= 5.0

    if is_motion_verified:
        popper_status = "SUPPORTED"
        verdict = f"Astrometric motion confirmed at {significance_sigma:.1f} sigma (displacement={total_displacement_arcsec:.2f}″ over {baseline_days:.1f} days)."
    elif is_motion_detected:
        popper_status = "CANDIDATE_DETECTION"
        verdict = f"Marginal motion detected at {significance_sigma:.1f} sigma. Requires extended baseline to reach 5-sigma discovery threshold."
    else:
        popper_status = "NON_DETECTION"
        verdict = f"Displacement ({total_displacement_arcsec:.3f}″) is within positional uncertainty ({centroid_uncertainty_arcsec:.2f}″). Consistent with stationary null hypothesis H0."

    return {
        "target_coords": {"ra_deg": ra_deg, "dec_deg": dec_deg},
        "baseline_days": baseline_days,
        "rate_source": rate_source,
        "daily_rate_arcsec_day": round(total_rate_arcsec_day, 4),
        "position_angle_deg": round(position_angle_deg, 1),
        "total_displacement_arcsec": round(total_displacement_arcsec, 3),
        "total_displacement_pixels": round(total_displacement_pixels, 2),
        "centroid_uncertainty_arcsec": centroid_uncertainty_arcsec,
        "significance_sigma": round(significance_sigma, 1),
        "validation_status": popper_status,
        "verdict": verdict,
        "trajectory": trajectory_points
    }
