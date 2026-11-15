import numpy as np
from typing import List, Dict, Any, Optional

def compute_coadd_stack(
    images: List[np.ndarray],
    variances: Optional[List[np.ndarray]] = None,
    method: str = "median"
) -> Dict[str, Any]:
    """
    Computes a multi-epoch co-addition stack of aligned SPHEREx cutouts.
    Raises signal-to-noise ratio by approximately sqrt(N).
    
    Stationary control stars intensify by sqrt(N), while moving targets
    (Planet X, asteroids, high proper-motion stars) blur into faint trails
    or disappear under median stacking.
    """
    if not images:
        raise ValueError("Must provide at least one image to compute stack.")

    n_epochs = len(images)
    stacked_shape = images[0].shape

    # Ensure all images match shape
    valid_images = [img for img in images if img.shape == stacked_shape]
    if len(valid_images) == 0:
        valid_images = images[:1]
    
    img_stack = np.stack(valid_images, axis=0)

    if method == "median":
        stacked_image = np.nanmedian(img_stack, axis=0)
    else:
        stacked_image = np.nanmean(img_stack, axis=0)

    # Uncertainty propagation: sigma_stack = sqrt(sum(sigma_i^2)) / N
    if variances and len(variances) == n_epochs:
        var_stack = np.stack(variances, axis=0)
        stacked_variance = np.nansum(var_stack, axis=0) / (n_epochs ** 2)
    else:
        # Fallback empirical variance
        bg_std = float(np.nanstd(stacked_image))
        stacked_variance = np.full_like(stacked_image, (bg_std / np.sqrt(n_epochs)) ** 2)

    # Calculate noise reduction & SNR gain
    snr_gain_factor = float(np.sqrt(n_epochs))
    input_noise_est = float(np.nanstd(valid_images[0])) if len(valid_images) > 0 else 0.05
    stacked_noise_est = float(np.nanstd(stacked_image))
    noise_reduction_pct = float(max(0.0, (1.0 - 1.0 / snr_gain_factor) * 100.0))

    return {
        "stacked_image": stacked_image,
        "stacked_variance": stacked_variance,
        "n_epochs_coadded": n_epochs,
        "method": method,
        "snr_gain_factor": round(snr_gain_factor, 2),
        "input_rms_mjy_sr": round(input_noise_est, 4),
        "stacked_rms_mjy_sr": round(stacked_noise_est, 4),
        "noise_reduction_pct": round(noise_reduction_pct, 1),
        "status": "COADD_OPTIMIZED"
    }
