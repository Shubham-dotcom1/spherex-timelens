import os
import csv
import pytest
import numpy as np
from PIL import Image
from astropy.io import fits
from astropy.wcs import WCS

FITS_PATH = "research/feasibility/sample_level2_1D4.fits"
PREVIEW_PATH = "research/feasibility/sample_level2_1D4_preview.png"
CSV_PATH = "target_feasibility.csv"

def test_genuine_fits_file_exists():
    """Assert that genuine SPHEREx FITS product was downloaded and is non-empty."""
    assert os.path.exists(FITS_PATH), f"FITS file not found at {FITS_PATH}"
    size = os.path.getsize(FITS_PATH)
    assert size > 60 * 1024 * 1024, f"FITS file is smaller than expected: {size} bytes"

def test_fits_hdu_structure():
    """Assert all 7 expected HDUs exist in the genuine SPHEREx level-2 file."""
    with fits.open(FITS_PATH) as hdul:
        ext_names = [hdu.name for hdu in hdul]
        expected_names = ['PRIMARY', 'IMAGE', 'FLAGS', 'VARIANCE', 'ZODI', 'EPSF', 'WCS-WAVE']
        for name in expected_names:
            assert name in ext_names, f"Missing expected HDU extension: {name}"

def test_fits_image_properties():
    """Assert IMAGE HDU has correct SPHEREx dimensions, units, and finite pixels."""
    with fits.open(FITS_PATH) as hdul:
        img_hdu = hdul['IMAGE']
        assert img_hdu.data.shape == (2040, 2040)
        assert img_hdu.header.get('BUNIT') == 'MJy / sr'
        valid = img_hdu.data[np.isfinite(img_hdu.data)]
        assert len(valid) > 4000000
        # Median background in infrared sky should be positive and realistic
        median_bg = float(np.median(valid))
        assert 0.0 < median_bg < 10.0, f"Unrealistic median background: {median_bg}"

def test_fits_wcs_distortion():
    """Assert WCS projection uses TAN-SIP distortion polynomial."""
    with fits.open(FITS_PATH) as hdul:
        w = WCS(hdul['IMAGE'].header)
        assert w.wcs.ctype[0] == 'RA---TAN-SIP'
        assert w.wcs.ctype[1] == 'DEC--TAN-SIP'
        # Center should be near NEP (RA ~ 270 deg, Dec ~ 68 deg)
        world = w.pixel_to_world(1020, 1020)
        assert 269.0 < world.ra.deg < 271.0
        assert 67.0 < world.dec.deg < 69.0

def test_fits_variance_and_flags():
    """Assert VARIANCE and FLAGS HDUs conform to scientific requirements."""
    with fits.open(FITS_PATH) as hdul:
        var = hdul['VARIANCE'].data
        assert var.shape == (2040, 2040)
        assert hdul['VARIANCE'].header.get('BUNIT') == 'MJy2 / sr2'
        
        flags = hdul['FLAGS'].data
        assert flags.shape == (2040, 2040)
        assert issubclass(flags.dtype.type, np.integer)

def test_fits_wcs_wave_table():
    """Assert WCS-WAVE spectral table exists with correct lookup columns."""
    with fits.open(FITS_PATH) as hdul:
        wave_hdu = hdul['WCS-WAVE']
        assert 'X' in wave_hdu.data.names
        assert 'Y' in wave_hdu.data.names
        assert 'VALUES' in wave_hdu.data.names
        # Max wavelength for Detector 4 should be around 3.8 microns
        vals = wave_hdu.data['VALUES']
        assert 3.5 < float(vals.max()) < 4.0

def test_preview_image_generated():
    """Assert PNG preview was successfully generated with valid dimensions."""
    assert os.path.exists(PREVIEW_PATH)
    img = Image.open(PREVIEW_PATH)
    assert img.size == (2040, 2040)
    assert img.mode == 'L'

def test_target_feasibility_csv_integrity():
    """Assert target feasibility CSV records actual results honestly without fabrication."""
    assert os.path.exists(CSV_PATH)
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        assert len(reader) == 6
        targets_by_id = {r['id']: r for r in reader}
        
        # Barnard's Star must be VERIFIED with 50 observations
        bs = targets_by_id['target-1-barnards-star']
        assert bs['status'] == 'VERIFIED'
        assert int(bs['observation_count']) == 50
        
        # NEP Benchmark must be VERIFIED
        nep = targets_by_id['benchmark-nep']
        assert nep['status'] == 'VERIFIED'
        
        # Epsilon Indi B and WISE 0855 must honestly report INSUFFICIENT_COVERAGE
        assert targets_by_id['target-2-epsilon-indi-b']['status'] == 'INSUFFICIENT_COVERAGE'
        assert targets_by_id['target-3-wise-0855']['status'] == 'INSUFFICIENT_COVERAGE'
