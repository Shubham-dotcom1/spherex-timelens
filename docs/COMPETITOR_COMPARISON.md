# Competitor and Reference Project Comparison
**Project: SPHEREx TimeLens**  
**Team: CodeGenesis**  
**Challenge: Planet X and SPHEREx — NASA Space Apps Challenge 2026**

---

## 1. Comparative Assessment Matrix

| Evaluation Criteria | Ashhajj0 (Repo 1) | SpaceAlpha (Repo 3) | PlanetX-NASA26 (Repo 4) | Orbital (Reference) | **SPHEREx TimeLens (CodeGenesis)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Real NASA IRSA Connection** | Partial (Pre-exported NEP) | None (Mock JSON) | Verified (Local CLI) | Verified (Live Flask) | **Verified (FastAPI + TAP/SIA + Cache)** |
| **FITS Multi-HDU Parsing** | Verified (Offline) | None | Verified (Minimal) | Custom parser | **Full Astropy Engine (All 6 HDUs)** |
| **Falsification Principle (Popper)** | Disclosed in text file | None | Minimal | None | **Core Architecture (H1–H5 Validation)** |
| **102 Bands vs. Time Separation** | High | Low | Medium | High | **Strict (Dimensionally Decoupled)** |
| **Difference Imaging Pipeline** | Static comparison | None | None | None | **WCS Reprojection + Variance Propagation** |
| **Proper Motion Astrometry** | Gaia DR3 match | Simulated orbits | None | Radial query | **Epoch-Aware Astrometry Propagation** |
| **Photometry & Uncertainty** | Calibrated flux | Hardcoded | None | None | **Aperture Photometry + Error Propagation** |
| **Spectral Extraction** | Pre-computed spectra | None | None | None | **Dynamic WCS-WAVE Interpolation** |
| **User Interface Paradigm** | Web dashboard | 3D solar scene | Minimal CLI | Interactive map | **Professional Observatory Dashboard** |
| **Real-Time Coordinate Query** | No (Static region export) | No | No (CLI only) | Yes (SIA) | **Yes (Arbitrary RA/Dec & Object Lookup)** |

---

## 2. Detailed Competitor Analysis

### 2.1 Repository 1: Ashhajj0/SPHEREX-And-PLANETX
- **Strengths**:
  - Comprehensive data pipeline script (`fetch_spherex.py`, `export_region.py`) that successfully retrieved 120 exposures for NEP.
  - Good documentation of SPHEREx data reduction steps and FITS extensions.
  - Ethical disclosure of synthetic fallbacks in `A short Disclaimer.txt`.
- **Weaknesses**:
  - The live web application is completely decoupled from the live IRSA archive; it serves static JSON files from `web/public/real/`.
  - When IRSA TAP returned 502/503 errors on the 5 mandatory targets, the pipeline generated synthetic fixtures rather than handling dynamic queries or retrying via async TAP.
  - Users cannot enter arbitrary RA/Dec coordinates in the web app to query the sky.

### 2.2 Repository 3: SpaceAlpha
- **Strengths**:
  - Well-structured software engineering documentation (PRD, TRD, UI Runbook).
  - Clean TypeScript interfaces for candidate moving objects.
- **Weaknesses**:
  - No connection to real astronomical archives.
  - All data is mocked (`candidates.json`, `releases.json`).
  - Procedural asteroid models do not reflect actual infrared flux or detector noise characteristics.

### 2.3 Repository 4: planetx-nasa26
- **Strengths**:
  - Direct SIA2 VOTable queries with Astropy.
  - Awareness of newer data release identifiers (`spherex_dr1`, `spherex_qr3`).
  - Real FITS test fixtures stored in git for unit testing.
- **Weaknesses**:
  - No graphical user interface; only CLI scripts.
  - Synchronous queries fail on server-busy responses without background job polling.

### 2.4 Reference Project: Orbital
- **Strengths**:
  - Dynamic web server that connects to IRSA SIA2 in real time.
  - In-memory LRU caching to mitigate repeat upstream queries.
  - Integration with Aladin Lite and HiPS progressive surveys.
- **Weaknesses**:
  - Does not implement scientific difference imaging or variance propagation.
  - Custom binary FITS parser is fragile and skips complex header cards (e.g., SIP polynomials).

---

## 3. CodeGenesis Differentiation & Competitive Advantage

**SPHEREx TimeLens** establishes a new benchmark for astronomical exploration software:
1. **Dynamic & Resilient Data Ingestion**: Live queries against IRSA TAP/SIA with local multi-tier caching (RAM + metadata SQLite/JSON + FITS disk cache).
2. **Strict Popperian Scientific Integrity**: Every hypothesis ($H_1$ to $H_5$) is explicitly testable, auditable, and falsifiable. When data is absent or inconclusive, the platform honestly communicates insufficient coverage.
3. **Rigorous Image Processing**: Difference imaging is executed with WCS-aware coordinate reprojection, PSF normalization, and pixel-by-pixel uncertainty propagation from the `VARIANCE` HDU.
4. **Dimensionally Decoupled Architecture**: Absolute preservation of the boundary between the 102 spectral bands and observation epochs.
