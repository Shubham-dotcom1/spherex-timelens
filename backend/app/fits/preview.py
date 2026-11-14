import io
from pathlib import Path
from typing import Optional, Union
import numpy as np
from PIL import Image

def array_to_preview_png(
    data: np.ndarray,
    stretch: str = "percentile",
    p_min: float = 0.5,
    p_max: float = 99.5,
    invert: bool = False
) -> bytes:
    """
    Applies astronomical contrast stretch to a 2D float array and encodes to PNG bytes.
    Handles NaNs, infinite values, and extreme infrared dynamic range.
    """
    valid = data[np.isfinite(data)]
    if len(valid) == 0:
        # Blank canvas
        blank = np.zeros((data.shape[0] or 256, data.shape[1] or 256), dtype=np.uint8)
        img = Image.fromarray(blank)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    low, high = np.percentile(valid, [p_min, p_max])
    if high <= low:
        high = low + 1e-5

    # Contrast stretch
    if stretch == "asinh":
        beta = (high - low) / 10.0 or 1.0
        stretched = np.arcsinh((data - low) / beta) / np.arcsinh((high - low) / beta)
        norm = np.clip(stretched, 0.0, 1.0)
    else:  # standard percentile
        clipped = np.clip(data, low, high)
        norm = (clipped - low) / (high - low)

    norm = np.nan_to_num(norm, nan=0.0)
    if invert:
        norm = 1.0 - norm

    arr_8bit = (norm * 255.0).astype(np.uint8)
    img = Image.fromarray(arr_8bit, mode="L")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def generate_fallback_preview(width: int = 512, height: int = 512, seed: int = 42) -> bytes:
    """Generates a calibrated synthetic starfield for sky previews where local FITS is absent."""
    rng = np.random.default_rng(seed)
    # Background Gaussian noise
    bg = rng.normal(loc=0.08, scale=0.01, size=(height, width))
    # Inject point sources
    num_stars = 40
    for _ in range(num_stars):
        x = rng.integers(10, width - 10)
        y = rng.integers(10, height - 10)
        flux = rng.exponential(scale=5.0) + 0.5
        # 2D Gaussian PSF
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                r2 = dx*dx + dy*dy
                bg[y + dy, x + dx] += flux * np.exp(-r2 / (2.0 * 1.5 * 1.5))
    return array_to_preview_png(bg, stretch="asinh")
