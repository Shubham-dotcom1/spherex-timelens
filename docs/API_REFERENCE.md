# SPHEREx TimeLens – Backend REST API Reference
**Team CodeGenesis – NASA Space Apps Challenge 2026**

The SPHEREx TimeLens backend is an asynchronous, high-performance scientific REST API built with FastAPI and Python 3. It directly interfaces with the NASA/IPAC Infrared Science Archive (IRSA) Table Access Protocol (TAP) service and processes multi-HDU astronomical FITS files.

**Base URL**: `http://localhost:8000/api` (or proxied via Vite at `/api`)  
**Interactive OpenAPI Docs**: `http://localhost:8000/docs`

---

## 1. System Health & Target Presets

### `GET /api/health`
Returns the operational health of the scientific backend and connectivity to the NASA/IPAC IRSA TAP service.

**Response (200 OK)**:
```json
{
  "status": "HEALTHY",
  "service": "SPHEREx TimeLens Scientific Backend",
  "version": "1.0.0",
  "team": "CodeGenesis",
  "challenge": "NASA Space Apps Challenge 2026 - Planet X and SPHEREx",
  "archive_status": "ONLINE",
  "cached_exposures": 1,
  "sample_fits_available": true
}
```

### `GET /api/targets`
Returns the 5 mandatory astronomical targets specified by the NASA challenge plus the North Ecliptic Pole (NEP) calibration benchmark.

### `GET /api/targets/{target_id}`
Returns detailed metadata, catalogue astrometry, and proper motion parameters for a specific target.

---

## 2. Archive Retrieval & Spatial Queries

### `GET /api/observations`
Performs an ADQL spatial query against NASA/IPAC IRSA TAP service (`spherex.artifact` JOIN `spherex.plane`) to retrieve genuine SPHEREx Level-2 science exposures.

**Query Parameters**:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `ra` | `float` | Optional | Right Ascension in decimal degrees (0° to 360°) |
| `dec` | `float` | Optional | Declination in decimal degrees (-90° to +90°) |
| `coords` | `string` | Optional | Sexagesimal or decimal string (e.g. `17h57m48.5s +04d41m36s`) |
| `radius_deg` | `float` | Optional | Search cone radius in degrees (default: 0.25°, max: 5.0°) |
| `band` | `string` | Optional | SPHEREx detector filter (`SPHEREx-D1` to `SPHEREx-D6`) |

**Response (200 OK)**: Array of `ObservationRecord` objects:
```json
[
  {
    "obs_id": "level2_2025W17_4B_0021_1D4_spx_l2b-v27-2026-196",
    "product_id": "SPHEREx-D4-0021",
    "uri": "https://irsa.ipac.caltech.edu/ibe/data/spherex/...",
    "datarelease": "dr1",
    "detector": 4,
    "band": "SPHEREx-D4",
    "wavelength_min_um": 2.42,
    "wavelength_max_um": 3.82,
    "mjd": 60789.25,
    "obs_date": "2025-04-24T06:00:00",
    "ra": 270.3317,
    "dec": 66.5614,
    "has_local_file": true,
    "preview_url": "/api/preview/sample_level2_1D4",
    "status": "AVAILABLE"
  }
]
```

---

## 3. Image Rendering & Cutout Services

### `GET /api/preview/{obs_id}`
Returns a scientifically contrast-stretched (Percentile 99.5% / Asinh) 8-bit PNG image of the requested SPHEREx exposure.

**Query Parameters**:
* `stretch`: `percentile` (default), `asinh`, `linear`, `sqrt`, `log`
* `colormap`: `inferno` (default), `viridis`, `plasma`, `grayscale`, `coolwarm`

**Response**: Binary image stream (`image/png`).

### `GET /api/cutout`
Generates a sub-pixel WCS cutout around specified celestial coordinates.

**Query Parameters**:
* `obs_id`: Target observation identifier
* `ra`, `dec`: Center celestial coordinates (degrees)
* `size_arcmin`: Cutout angular dimension (default: 15.0 arcminutes)

---

## 4. Scientific Analysis & Popperian Validation

### `POST /api/analysis/photometry`
Performs circular aperture photometry with background annulus subtraction and full variance propagation.

**Request Body**:
```json
{
  "obs_id": "sample_level2_1D4",
  "ra": 270.203021,
  "dec": 68.038062,
  "aperture_radius_arcsec": 6.2,
  "inner_annulus_arcsec": 12.4,
  "outer_annulus_arcsec": 24.8
}
```

**Response (200 OK)**:
```json
{
  "obs_id": "sample_level2_1D4",
  "ra": 270.203021,
  "dec": 68.038062,
  "flux_mjy": 48.72,
  "flux_err_mjy": 2.14,
  "snr": 22.76,
  "background_level": 0.312,
  "aperture_radius_arcsec": 6.2,
  "validation_status": "SUPPORTED",
  "notes": "Source detected at SNR=22.8 sigma."
}
```

### `POST /api/analysis/difference`
Computes multi-epoch image subtraction ($I_2 - I_1$), propagates variances, generates a standardized significance map ($(I_2 - I_1)/\sigma$), and detects transient candidate sources at the specified sigma threshold.

**Request Body**:
```json
{
  "reference_obs_id": "sample_level2_1D4",
  "target_obs_id": "sample_level2_1D4",
  "ra": 270.203021,
  "dec": 68.038062,
  "box_size_pixels": 512,
  "detection_threshold_sigma": 5.0
}
```

### `GET /api/analysis/spectrum`
Extracts a 102-channel infrared Spectral Energy Distribution (SED) curve ($F_\nu$ in mJy vs $\lambda$ in $\mu m$) across the 6 detector bands (0.75 to 5.00 $\mu m$) using the empirical `WCS-WAVE` calibration lookup table.

### `GET /api/analysis/lightcurve`
Extracts a multi-epoch photometric light curve and evaluates the constant-source null hypothesis ($H_0$) using a $\chi^2$ goodness-of-fit test.

### `POST /api/analysis/validation-report`
Executes the comprehensive Karl Popper Falsification Protocol across hypotheses H1 through H4, producing an audit record with reproducibility parameters.
