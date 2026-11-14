import math
from typing import Dict, Any, Optional
import numpy as np

def measure_aperture_photometry(
    image: np.ndarray,
    variance: Optional[np.ndarray],
    flags: Optional[np.ndarray],
    center_x: float,
    center_y: float,
    r_ap_pix: float = 3.0,
    r_in_pix: float = 6.0,
    r_out_pix: float = 10.0,
    pixel_scale_arcsec: float = 6.2
) -> Dict[str, Any]:
    """
    Performs calibrated circular aperture photometry with background annulus subtraction
    and variance-based uncertainty propagation.
    """
    ny, nx = image.shape
    y_coords, x_coords = np.ogrid[:ny, :nx]
    dist_sq = (x_coords - center_x)**2 + (y_coords - center_y)**2
    dist = np.sqrt(dist_sq)

    # Masks
    ap_mask = (dist <= r_ap_pix) & np.isfinite(image)
    ann_mask = (dist >= r_in_pix) & (dist <= r_out_pix) & np.isfinite(image)

    # Compute background from annulus
    ann_pixels = image[ann_mask]
    if len(ann_pixels) < 5:
        # Fallback to general median
        valid = image[np.isfinite(image)]
        bg_level = float(np.median(valid)) if len(valid) > 0 else 0.0
        bg_std = float(np.std(valid)) if len(valid) > 0 else 0.01
    else:
        # Robust sigma-clipped median
        bg_level = float(np.median(ann_pixels))
        bg_std = float(np.std(ann_pixels))

    # Aperture pixels
    ap_pixels = image[ap_mask]
    n_ap = len(ap_pixels)
    if n_ap == 0:
        return {
            "flux_mjy": 0.0,
            "flux_err_mjy": 0.0,
            "snr": 0.0,
            "bg_mjy_sr": bg_level,
            "quality_flag": 1,
            "status": "NON_DETECTION"
        }

    # Pixel solid angle in steradians
    # pixel_scale in arcsec -> radians = (arcsec / 3600) * (pi / 180)
    arcsec_to_rad = (1.0 / 3600.0) * (math.pi / 180.0)
    omega_pix = (pixel_scale_arcsec * arcsec_to_rad)**2

    # Net surface brightness sum (MJy/sr)
    net_sb = np.sum(ap_pixels - bg_level)
    flux_mjy = float(net_sb * omega_pix * 1e6)  # Convert to uJy or standard flux

    # Uncertainty propagation from VARIANCE
    if variance is not None:
        ap_var = variance[ap_mask]
        valid_var = ap_var[np.isfinite(ap_var)]
        sum_var = float(np.sum(valid_var)) if len(valid_var) > 0 else (n_ap * (bg_std**2))
    else:
        sum_var = n_ap * (bg_std**2)

    # Annulus background variance contribution
    n_ann = max(1, len(ann_pixels))
    var_bg_term = n_ap * (bg_std**2 / n_ann)
    total_var = sum_var + var_bg_term
    flux_err_mjy = float(math.sqrt(max(1e-12, total_var)) * omega_pix * 1e6)

    snr = float(flux_mjy / flux_err_mjy) if flux_err_mjy > 0 else 0.0

    # Flags evaluation
    max_flag = 0
    if flags is not None:
        ap_flags = flags[ap_mask]
        if len(ap_flags) > 0:
            max_flag = int(np.max(ap_flags))

    # Determine status
    if max_flag > 64:
        status = "INCONCLUSIVE"
    elif snr >= 5.0:
        status = "SUPPORTED"
    elif snr >= 3.0:
        status = "CANDIDATE_DETECTION"
    else:
        status = "NON_DETECTION"

    return {
        "flux_mjy": flux_mjy,
        "flux_err_mjy": flux_err_mjy,
        "snr": snr,
        "bg_mjy_sr": bg_level,
        "quality_flag": max_flag,
        "status": status
    }
