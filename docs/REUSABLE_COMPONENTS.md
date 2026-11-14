# Reusable Architectural Concepts & Clean-Room Strategy
**Project: SPHEREx TimeLens**  
**Team: CodeGenesis**  
**Challenge: Planet X and SPHEREx — NASA Space Apps Challenge 2026**

---

## 1. Clean-Room Engineering Mandate

Per competition guidelines and strict engineering standards:
- **No proprietary code or source files from audited repositories are copied or included.**
- All components in **SPHEREx TimeLens** are developed as clean-room implementations based on official IVOA standards, NASA/IPAC IRSA public documentation, and scientific astronomical principles (Astropy, Photutils, SciPy).

---

## 2. Conceptual Architectural Patterns Identified for Independent Implementation

### 2.1 IVOA TAP & SIA2 Query Architecture
- **Concept**: Querying NASA/IPAC IRSA using standard astronomical Virtual Observatory protocols.
- **Reference Pattern**:
  - TAP ADQL against `spherex.plane` and `spherex.artifact` (`CONTAINS(POINT('ICRS', ra, dec), p.poly) = 1`).
  - SIA2 query against `https://irsa.ipac.caltech.edu/SIA` with `COLLECTION=spherex_dr1`.
- **CodeGenesis Independent Implementation**:
  - Implement a resilient asynchronous `IrsaTapClient` in `backend/app/archive/irsa_client.py`.
  - Add automatic query fallback: lightweight bounding-box pre-filtering, no unindexed full-table sorting, configurable timeout with exponential backoff.
  - Multi-release management layer supporting `spherex_dr1`, `spherex_qr3`, and future public releases.

### 2.2 FITS Multi-Extension Handling & Bitmask Decoding
- **Concept**: SPHEREx level-2 spectral images pack 6 distinct scientific extensions into each file.
- **Data Model**:
  - `PRIMARY`: Global provenance and telemetry metadata.
  - `IMAGE`: Calibrated surface brightness ($I_\nu$) in units of $\text{MJy/sr}$.
  - `VARIANCE`: Uncertainty variance ($\sigma^2$) in $(\text{MJy/sr})^2$.
  - `FLAGS`: Bitmask flags (`int32`) identifying cosmic rays, bad pixels, saturation, and calibration defects.
  - `ZODI`: Zodiacal foreground emission model.
  - `WCS-WAVE`: Tabular mapping between focal-plane pixel coordinates $(x, y)$ and central wavelength $\lambda_0$ / bandwidth $\Delta\lambda$.
- **CodeGenesis Independent Implementation**:
  - `backend/app/fits/reader.py`: Robust Astropy-based multi-HDU reader that validates headers, verifies WCS-SIP distortion parameters, extracts calibrated image arrays, and isolates the bitmask flags.
  - Quality masking module that systematically masks out corrupt pixels before any photometry or image subtraction.

### 2.3 WCS-WAVE Spectral Wavelength Interpolation
- **Concept**: SPHEREx utilizes Linear Variable Filters (LVF). Unlike slit spectrometers or broad-band imagers, each pixel in a detector array corresponds to a specific, smoothly varying wavelength $\lambda(x, y)$.
- **Mathematical Model**:
  - The `WCS-WAVE` binary table provides a sparse grid of $(X, Y)$ sampling points with corresponding $(\lambda_0, \Delta\lambda)$ values.
  - Bilinear or 2D spline interpolation is required to map any target sky coordinate $(\alpha, \delta) \to (x, y) \to \lambda$.
- **CodeGenesis Independent Implementation**:
  - Implement a standalone `WcsWaveCalibrator` using `scipy.interpolate.RegularGridInterpolator` to accurately compute the exact central wavelength and spectral resolution for any source aperture.

### 2.4 Scientifically Valid Difference Imaging Pipeline
- **Concept**: High-precision image subtraction for moving object and transient discovery.
- **Algorithmic Flow**:
  1. **Spatial Alignment**: Reproject Image B onto the exact WCS grid of Image A (`reproject_interp`).
  2. **Background Matching**: Compute robust 2D sigma-clipped background for both epochs.
  3. **Photometric Normalization**: Flux-scale images using stationary reference stars.
  4. **Subtraction**: Residual image $D = I_A - k \cdot I_B$.
  5. **Variance Propagation**: $\sigma_D^2 = \sigma_A^2 + k^2 \sigma_B^2$.
  6. **Significance Map**: $S = D / \sigma_D$.
- **CodeGenesis Independent Implementation**:
  - Implement `DifferenceEngine` in `backend/app/processing/difference.py` with stationary control source validation to prevent false-positive residual detections.

### 2.5 Multi-Epoch Astrometric Propagation (Fixed Sky vs. Moving Target)
- **Concept**: Disentangling proper motion and parallax from observational noise.
- **Mathematical Model**:
  - For high proper motion objects (e.g. Barnard's Star: $\mu_\alpha = -798.58\text{ mas/yr}$, $\mu_\delta = 10328.12\text{ mas/yr}$, $\varpi = 547.45\text{ mas}$):
    $$\alpha(t) = \alpha_0 + \frac{\mu_\alpha \cos \delta_0}{\cos \delta(t)} (t - t_0) + \Delta \alpha_\text{parallax}(t)$$
- **CodeGenesis Independent Implementation**:
  - Build `AstrometryTracker` in `backend/app/astrometry/tracker.py` using `astropy.coordinates.SkyCoord` with space motion propagation to predict exact celestial coordinates at each observation epoch MJD.

---

## 3. Comparison: What We Build vs. What Existed

| Component | Prior Projects | CodeGenesis SPHEREx TimeLens |
| :--- | :--- | :--- |
| **API Backend** | Mostly static exports (Repo 1, 3) or simple scripts | Complete FastAPI scientific microservice with Pydantic validation |
| **Archive Ingestion** | Monolithic sync scripts prone to timeouts | Asynchronous resilient client with local disk/metadata caching |
| **Target Feasibility** | Hardcoded fixtures on timeout | Honest falsification engine displaying real coverage or explicit non-coverage |
| **Difference Imaging** | Simple naive pixel subtraction | Full WCS reprojection, background matching, and variance propagation |
| **Spectral Extraction** | Pre-baked JSON arrays | Real-time $(x, y) \to \lambda$ extraction from `WCS-WAVE` tables |
| **Frontend Architecture** | Static dashboards or Three.js toys | Professional Observatory UI: Coordinate Explorer, Time Machine, Compare, Analyze |
