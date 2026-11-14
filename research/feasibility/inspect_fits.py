import os
import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image

fits_path = "research/feasibility/sample_level2_1D4.fits"

print("=" * 70)
print(f"INSPECTING GENUINE SPHEREx FITS PRODUCT: {fits_path}")
print("=" * 70)

with fits.open(fits_path) as hdul:
    print(f"Total HDUs: {len(hdul)}")
    hdul.info()
    print("-" * 70)
    
    # Inspect PRIMARY Header
    prim_hdr = hdul[0].header
    print("PRIMARY HEADER (Sample key metadata):")
    for key in ['TELESCOP', 'INSTRUME', 'ORIGIN', 'DATE-OBS', 'MJD-OBS', 'EXPTIME', 'OBSID', 'BAND', 'DETECTOR']:
        val = prim_hdr.get(key, 'NOT_FOUND')
        print(f"  {key:12}: {val}")
    
    # Check all extension names
    ext_names = [hdu.name for hdu in hdul]
    print(f"\nExtension Names: {ext_names}")
    
    # Inspect IMAGE HDU
    if 'IMAGE' in hdul:
        img_hdu = hdul['IMAGE']
        data = img_hdu.data
        hdr = img_hdu.header
        print(f"\nIMAGE HDU:")
        print(f"  Data shape : {data.shape}")
        print(f"  Dtype      : {data.dtype}")
        print(f"  BUNIT      : {hdr.get('BUNIT', 'N/A')}")
        valid = data[np.isfinite(data)]
        print(f"  Total pixels: {data.size}, Finite pixels: {len(valid)} ({len(valid)/data.size*100:.1f}%)")
        if len(valid) > 0:
            print(f"  Min / Median / Max: {np.min(valid):.4f} / {np.median(valid):.4f} / {np.max(valid):.4f} {hdr.get('BUNIT', '')}")
            p1, p99 = np.percentile(valid, [1, 99])
            print(f"  1st / 99th percentile: {p1:.4f} / {p99:.4f}")
        
        # WCS Inspection
        wcs = WCS(hdr)
        print(f"\nWCS Information:")
        print(f"  CTYPE: {wcs.wcs.ctype}")
        print(f"  CRVAL: {wcs.wcs.crval}")
        print(f"  CRPIX: {wcs.wcs.crpix}")
        try:
            center_coord = wcs.pixel_to_world(data.shape[1]/2, data.shape[0]/2)
            print(f"  Field Center Coord (RA, Dec): {center_coord.ra.deg:.6f} deg, {center_coord.dec.deg:.6f} deg")
        except Exception as e:
            print(f"  WCS pixel_to_world error: {e}")
            
        # Generate scientific PNG preview
        # Asinh or Percentile stretch
        if len(valid) > 0:
            p0_5, p99_5 = np.percentile(valid, [0.5, 99.5])
            clipped = np.clip(data, p0_5, p99_5)
            # Normalize to 0-255
            norm = (clipped - p0_5) / (p99_5 - p0_5 + 1e-10)
            norm = np.nan_to_num(norm, nan=0.0)
            # Invert for astronomical display (dark stars on light background or standard light on dark)
            preview_arr = (norm * 255).astype(np.uint8)
            preview_img = Image.fromarray(preview_arr)
            preview_path = "research/feasibility/sample_level2_1D4_preview.png"
            preview_img.save(preview_path)
            print(f"\nGenerated scientific preview: {preview_path} ({preview_img.size})")

    # Inspect VARIANCE HDU
    if 'VARIANCE' in hdul:
        var_data = hdul['VARIANCE'].data
        valid_var = var_data[np.isfinite(var_data)]
        print(f"\nVARIANCE HDU:")
        print(f"  Data shape : {var_data.shape}")
        print(f"  BUNIT      : {hdul['VARIANCE'].header.get('BUNIT', 'N/A')}")
        if len(valid_var) > 0:
            print(f"  Min / Median / Max: {np.min(valid_var):.6f} / {np.median(valid_var):.6f} / {np.max(valid_var):.6f}")

    # Inspect FLAGS HDU
    if 'FLAGS' in hdul:
        flags_data = hdul['FLAGS'].data
        print(f"\nFLAGS HDU:")
        print(f"  Data shape : {flags_data.shape}")
        print(f"  Dtype      : {flags_data.dtype}")
        unique_flags, counts = np.unique(flags_data, return_counts=True)
        print(f"  Unique flag values (first 10): {list(zip(unique_flags[:10], counts[:10]))}")

    # Inspect WCS-WAVE HDU
    if 'WCS-WAVE' in hdul:
        wave_hdu = hdul['WCS-WAVE']
        print(f"\nWCS-WAVE HDU:")
        print(f"  Type       : {type(wave_hdu).__name__}")
        print(f"  Header keys: {list(wave_hdu.header.keys())[:15]}")
        if hasattr(wave_hdu, 'data') and wave_hdu.data is not None:
            print(f"  Data shape : {wave_hdu.data.shape if hasattr(wave_hdu.data, 'shape') else len(wave_hdu.data)}")
            if hasattr(wave_hdu.data, 'names'):
                print(f"  Table Columns: {wave_hdu.data.names}")
