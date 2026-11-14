from pathlib import Path
from typing import Tuple, Optional
import numpy as np
from astropy.io import fits
from scipy.interpolate import RegularGridInterpolator

class WcsWaveCalibrator:
    """Interpolates central wavelength and bandwidth from SPHEREx WCS-WAVE lookup table."""

    def __init__(self, fits_path: Optional[Path] = None):
        self._interpolator_wave = None
        self._interpolator_bandwidth = None
        if fits_path and fits_path.exists():
            self.load_fits(fits_path)

    def load_fits(self, fits_path: Path) -> None:
        """Loads WCS-WAVE HDU and prepares 2D RegularGridInterpolators."""
        with fits.open(fits_path) as hdul:
            if "WCS-WAVE" in hdul:
                tbl = hdul["WCS-WAVE"].data
                # X coordinates shape: (1, 13) -> 1D array of 13 coords
                x_pts = np.asarray(tbl["X"][0], dtype=float)
                # Y coordinates shape: (1, 20) -> 1D array of 20 coords
                y_pts = np.asarray(tbl["Y"][0], dtype=float)
                # VALUES shape: (1, 20, 13, 2)
                # Dim 0: wavelength, Dim 1: bandwidth
                vals = np.asarray(tbl["VALUES"][0], dtype=float)
                wave_grid = vals[..., 0]      # shape: (20, 13) corresponding to (Y, X)
                bandwidth_grid = vals[..., 1] # shape: (20, 13)

                # RegularGridInterpolator expects points (y_pts, x_pts)
                self._interpolator_wave = RegularGridInterpolator(
                    (y_pts, x_pts), wave_grid, bounds_error=False, fill_value=None
                )
                self._interpolator_bandwidth = RegularGridInterpolator(
                    (y_pts, x_pts), bandwidth_grid, bounds_error=False, fill_value=None
                )

    def get_wavelength_at_pixel(self, x: float, y: float) -> Tuple[float, float]:
        """
        Returns (central_wavelength_um, bandwidth_um) at focal plane pixel coordinates (x, y).
        Default fallback for Detector 4 is ~3.14 um and 0.04 um bandwidth.
        """
        if self._interpolator_wave is not None and self._interpolator_bandwidth is not None:
            # Query at (y, x)
            try:
                wave = float(self._interpolator_wave([[y, x]])[0])
                bw = float(self._interpolator_bandwidth([[y, x]])[0])
                return (wave, bw)
            except Exception:
                pass
        return (3.1415, 0.0412)

wave_calibrator = WcsWaveCalibrator()
