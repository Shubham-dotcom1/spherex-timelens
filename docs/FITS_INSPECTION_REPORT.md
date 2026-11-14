# Genuine SPHEREx FITS Product Inspection Report
**Project: SPHEREx TimeLens**  
**Team: CodeGenesis**  
**Challenge: Planet X and SPHEREx — NASA Space Apps Challenge 2026**

---

## 1. Product Identification

- **Local Path**: `research/feasibility/sample_level2_1D4.fits`
- **File Size**: 65,848,320 bytes (~62.8 MiB)
- **Archive Source**: Caltech / IPAC Infrared Science Archive (IRSA)
- **Archive URL**: `https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W17_4B/l2b-v27-2026-196/4/level2_2025W17_4B_0021_1D4_spx_l2b-v27-2026-196.fits`
- **Observation ID**: `2025W17_4B_0021_1`
- **Observation Date**: `2025-04-24T21:06:38.391 UTC`
- **MJD-OBS**: `60789.879611007`
- **Detector Array**: `DETECTOR 4` (Nominal spectral coverage: 2.42 – 3.86 $\mu\text{m}$)
- **Calibration Level**: Level-2 (Calibrated single-exposure spectral image)

---

## 2. HDU Architecture Overview

The inspected genuine SPHEREx FITS product contains seven Header Data Units (HDUs):

| HDU # | Name | Ver | Type | Format / Dtype | Dimensions | Purpose |
| :---: | :--- | :---: | :--- | :---: | :---: | :--- |
| **0** | `PRIMARY` | 1 | PrimaryHDU | None | () | Global mission provenance & telemetry metadata |
| **1** | `IMAGE` | 1 | ImageHDU | `float32` (`>f4`) | $2040 \times 2040$ | Calibrated surface brightness ($I_\nu$ in $\text{MJy/sr}$) |
| **2** | `FLAGS` | 1 | CompImageHDU | `int32` | $2040 \times 2040$ | Pixel quality bitmask (cosmic rays, bad pixels, saturation) |
| **3** | `VARIANCE` | 1 | ImageHDU | `float32` (`>f4`) | $2040 \times 2040$ | Uncertainty variance ($\sigma^2$ in $\text{MJy}^2/\text{sr}^2$) |
| **4** | `ZODI` | 1 | ImageHDU | `float32` (`>f4`) | $2040 \times 2040$ | Zodiacal foreground light model |
| **5** | `EPSF` | 1 | BinTableHDU | Binary Table | 441 rows $\times$ 11 cols | Empirical Point Spread Function grid model |
| **6** | `WCS-WAVE` | 1 | BinTableHDU | Binary Table | 1 row $\times$ 3 cols | Pixel-to-wavelength spectral calibration lookup table |

---

## 3. Quantitative Extension Analysis

### 3.1 IMAGE HDU
- **Array Dimensions**: $2040 \times 2040$ (4,161,600 total pixels)
- **Finite Pixels**: 4,159,487 pixels (99.9% finite coverage; 2,113 masked border/NaN pixels)
- **Photometric Units (`BUNIT`)**: `MJy / sr` (MegaJanskys per steradian)
- **Background Statistics**:
  - Minimum: $-2582.2070\text{ MJy/sr}$ (Negative noise excursions/bad pixels)
  - Median: $0.0877\text{ MJy/sr}$ (True diffuse infrared sky background)
  - Maximum: $70324.1328\text{ MJy/sr}$ (Bright saturated point source)
  - 1st Percentile: $0.0547\text{ MJy/sr}$
  - 99th Percentile: $0.5882\text{ MJy/sr}$

### 3.2 WCS Astrometric Projection
- **Coordinate System**: ICRS
- **Projection Types (`CTYPE`)**: `['RA---TAN-SIP', 'DEC--TAN-SIP']`
- **Distortion Model**: Simple Imaging Polynomial (SIP) distortion coefficients
- **Reference Pixel (`CRPIX`)**: `[1020.5, 1020.5]` (Center of $2040 \times 2040$ focal plane)
- **Reference Value (`CRVAL`)**: `RA = 270.203021°`, `Dec = +68.038062°`
- **Calculated Field Center**: `RA = 270.199777°`, `Dec = +68.037074°`
- **Pixel Scale**: $\sim 6.2\text{ arcsec/pixel}$
- **Total Field of View**: $\sim 3.5° \times 3.5°$

### 3.3 VARIANCE HDU
- **Units (`BUNIT`)**: `MJy2 / sr2`
- **Median Variance**: $0.000104\text{ (MJy/sr)}^2 \implies \sigma_\text{noise} \approx 0.0102\text{ MJy/sr}$
- **Significance Capability**: Enables rigorous pixel-by-pixel uncertainty propagation:
  $$\sigma_\text{diff}(x, y) = \sqrt{\sigma_A^2(x, y) + \sigma_B^2(x, y)}$$

### 3.4 FLAGS HDU
- **Data Type**: `int32` (Bitwise bitmask)
- **Key Flags Observed**:
  - `0`: Pristine scientific pixel ($1,729,769$ pixels)
  - `64`: Low-level background suspect
  - `128`: Edge/vignetting zone ($49,992$ pixels)
  - Non-zero bit combinations: Cosmic ray hits, saturated pixels, dead pixels.

### 3.5 WCS-WAVE HDU (Spectral Calibration Table)
- **Lookup Dimensions**:
  - `X`: Grid of 13 column coordinates: `[1, 171, 341, ..., 2040]`
  - `Y`: Grid of 20 row coordinates: `[1, 151, 301, ..., 2040]`
  - `VALUES`: Array of shape `(1, 20, 13, 2)`:
    - Slice `VALUES[..., 0]`: Central wavelength $\lambda_0$ in microns ($\mu\text{m}$).
    - Slice `VALUES[..., 1]`: Effective bandwidth $\Delta\lambda$ in microns.
- **Detector 4 Spectral Coverage**: $2.42\text{ }\mu\text{m}$ to $3.86\text{ }\mu\text{m}$.
- **Implication**: Any spatial pixel coordinate $(x, y)$ in the exposure corresponds to a known, calibrated infrared wavelength.

---

## 4. Scientific Preview Generation

Using an astronomical 0.5%–99.5% percentile contrast stretch:
- Output file: `research/feasibility/sample_level2_1D4_preview.png`
- Format: 8-bit grayscale PNG, $2040 \times 2040$ pixels
- Result: Sharp stellar point sources, zodiacal gradient, and detector edge masks are clearly resolved without clipping scientific dynamic range.
