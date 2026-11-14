import math
from typing import Dict, Any, Tuple
import numpy as np
from backend.app.fits.preview import array_to_preview_png

def compute_difference_map(
    img_a: np.ndarray,
    img_b: np.ndarray,
    var_a: np.ndarray = None,
    var_b: np.ndarray = None
) -> Dict[str, Any]:
    """
    Computes scientifically controlled difference image and significance map
    with variance propagation.
    """
    # Align shapes if slight mismatch
    min_ny = min(img_a.shape[0], img_b.shape[0])
    min_nx = min(img_a.shape[1], img_b.shape[1])
    a = img_a[:min_ny, :min_nx].copy()
    b = img_b[:min_ny, :min_nx].copy()

    # Background estimation
    valid_a = a[np.isfinite(a)]
    valid_b = b[np.isfinite(b)]
    bg_a = float(np.median(valid_a)) if len(valid_a) > 0 else 0.0
    bg_b = float(np.median(valid_b)) if len(valid_b) > 0 else 0.0

    a_sub = a - bg_a
    b_sub = b - bg_b

    # Photometric scale factor k (least squares slope between valid common pixels)
    mask = np.isfinite(a_sub) & np.isfinite(b_sub)
    if np.sum(mask) > 50:
        k = float(np.sum(a_sub[mask] * b_sub[mask]) / (np.sum(b_sub[mask]**2) + 1e-10))
        # Keep k within physically plausible bounds [0.5, 2.0]
        k = max(0.5, min(2.0, k))
    else:
        k = 1.0

    # Difference image D = A - k * B
    diff = a_sub - k * b_sub

    # Variance propagation
    if var_a is not None and var_b is not None:
        va = var_a[:min_ny, :min_nx].copy()
        vb = var_b[:min_ny, :min_nx].copy()
        var_diff = va + (k**2) * vb
        std_diff = np.sqrt(np.maximum(1e-12, var_diff))
    else:
        # Empirical residual noise
        std_diff = np.full_like(diff, float(np.std(diff[np.isfinite(diff)])) if np.sum(np.isfinite(diff)) > 0 else 0.01)

    # Significance map S = D / sigma_D
    sig_map = np.divide(diff, std_diff, out=np.zeros_like(diff), where=(std_diff > 0) & np.isfinite(diff))

    # Calculate metrics
    valid_sig = sig_map[np.isfinite(sig_map)]
    max_sig = float(np.max(np.abs(valid_sig))) if len(valid_sig) > 0 else 0.0

    diff_bytes = array_to_preview_png(diff, stretch="percentile", p_min=1.0, p_max=99.0)
    sig_bytes = array_to_preview_png(sig_map, stretch="percentile", p_min=1.0, p_max=99.0)

    status = "CANDIDATE_DETECTION" if max_sig >= 5.0 else ("NON_DETECTION" if max_sig < 3.0 else "INCONCLUSIVE")

    return {
        "diff_array": diff,
        "sig_map": sig_map,
        "diff_png_bytes": diff_bytes,
        "sig_png_bytes": sig_bytes,
        "scale_k": k,
        "max_significance_sigma": max_sig,
        "status": status
    }
