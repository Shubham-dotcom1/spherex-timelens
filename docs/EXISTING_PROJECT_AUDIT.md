# Technical Audit of Existing Repositories
**Project: SPHEREx TimeLens**  
**Team: CodeGenesis**  
**Challenge: Planet X and SPHEREx — NASA Space Apps Challenge 2026**

---

## 1. Executive Summary

In accordance with Phase 0 requirements, the autonomous engineering team inspected five existing repositories and reference architectures relating to NASA's SPHEREx mission and the search for moving/transient solar system and astrophysical phenomena. Each repository was cloned locally and analyzed across structure, dependencies, data acquisition mechanisms, FITS data engineering, scientific rigor, error handling, and licensing.

Per strict team instructions:
> **No code was copy-pasted or plagiarized.** All architectural patterns, limitations, and failure modes observed were catalogued to design our clean, robust, and reproducible application: **SPHEREx TimeLens**.

---

## 2. Audit Matrix by Repository

| Repository & Author | Classification | Real Archive Integration | FITS Processing | Multi-Epoch & Astrometry | Primary Limitation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Repo 1: Ashhajj0/SPHEREX-And-PLANETX** | **PARTIAL / MOCKED** | Partial (NEP only; 5 target stars fell back to synthetic fixtures) | High (Extracts IMAGE, VARIANCE, FLAGS, WCS-WAVE; drops PSF/ZODI) | Proper motion predicted via Gaia DR3 catalog; offline static JSON export | Web frontend does not query IRSA live; relies on static JSON export |
| **Repo 2: shabeebushhajj/SPHEREX-And-PLANETX** | **PARTIAL** | Identical code fork to Repo 1; commit history contains unpruned `.venv` (Python 3.12) | Identical to Repo 1 | Identical to Repo 1 | Incomplete git sanitation; essentially a mirrored/initial commit fork |
| **Repo 3: zohaibtop10-cyber/SpaceAlpha** | **MOCKED** | Mock data (`candidates.json`, `fields.json`, `releases.json`) | None (Procedural canvas and Three.js mock asteroids) | Simulated coordinate trajectories | Entirely synthetic demo pipeline; no genuine FITS or IRSA querying |
| **Repo 4: elsayedelmandoh/planetx-nasa26** | **VERIFIED (Spike)** | IVOA SIA2 via VOTable parsing against `spherex_dr1`/`spherex_qr3` | Verified (Test fixtures `pass1.fits`, `pass2.fits`, `pass3.fits`) | Multi-pass detector grouping (d6) | Minimal frontend; monolithic script pipeline prone to server 503 timeouts |
| **Ref: FaizeenHoque/Orbital** | **VERIFIED (Live SIA)** | Live IRSA SIA2 with in-memory LRU cache (`/SIA`) | Custom binary FITS header parsing; HiPS2FITS Aladin bridge | Static coordinates, polygon footprint intersection | Vulnerable to upstream gateway timeouts without async queuing |

---

## 3. Deep-Dive Repository Inspections

### 3.1 Repository 1: Ashhajj0/SPHEREx-And-PLANETX
- **Repository URL**: `https://github.com/Ashhajj0/SPHEREX-And-PLANETX`
- **Live Deployment**: `https://spherex-and-planetx.vercel.app/`
- **Codebase Anatomy**:
  - `pipeline/fetch_spherex.py`: Queries IRSA TAP collection `spherex_qr2` using ADQL spatial join (`spherex.artifact` JOIN `spherex.plane`). Drops 3D PSF cubes and ZODI to reduce file size.
  - `backend/compute/export_region.py`: Pre-renders cutouts and extracts calibrated photometry to static files (`web/public/real/regions/`).
  - `src/App.tsx`, `src/components/ExplorerPage.tsx`: Static React/Vite dashboard.
- **Scientific Honesty & Fallback Disclosure**:
  - The repository includes `A short Disclaimer.txt`:
    > *"The North Ecliptic Pole region runs on 120 real NASA SPHEREx QR2 FITS exposures from IPAC IRSA cross-matched with Gaia DR3. For our 5 target stars (Barnard's Star, Epsilon Indi, WISE 0855-0714, RW Aurigae, and R Draconis), IRSA's TAP/SIA servers were returning 502 errors during download, so the app preserves scientific honesty by displaying their real Gaia/SIMBAD coordinates and a physically modeled Synthetic Fixture preview..."*
- **Audit Classification**:
  - NEP Field: **VERIFIED** (120 genuine FITS exposures).
  - 5 Mandatory Targets: **MOCKED** (Synthetic fixtures used due to server timeout / coverage gaps).
  - Web UI: **STATIC** (Does not perform real-time IRSA API retrieval in the browser).

### 3.2 Repository 2: shabeebushhajj/SPHEREX-And-PLANETX
- **Repository URL**: `https://github.com/shabeebushhajj/SPHEREX-And-PLANETX`
- **Relationship to Repo 1**:
  - Shared repository name and identical file contents (`check_bits.py`, `check_flags.py`, `pipeline/regions.yaml`).
  - Git log reveals a 2-commit history (`Initial commit`, `Create python-app.yml`), whereas Repo 1 has subsequent commits fixing region switching.
  - Crucially, Repo 2 committed an entire Python virtual environment (`.venv/` containing 23,000+ files and site-packages for Python 3.12).
- **Audit Classification**: **PARTIAL / DUPLICATE**.

### 3.3 Repository 3: zohaibtop10-cyber/Nasa-SAC---Planetx-and-Spherex---SpaceAlpha
- **Repository URL**: `https://github.com/zohaibtop10-cyber/Nasa-SAC---Planetx-and-Spherex---SpaceAlpha`
- **Architecture**:
  - Strong on specifications (`1_Live_Sky_PRD.md`, `2_Live_Sky_TRD_and_APIs.md`).
  - Web interface uses React, Vite, Three.js (`SolarSystemScene.tsx`, `proceduralAsteroid.ts`).
  - Data layer is entirely simulated: `web/public/data/mock/candidates.json`, `fields.json`, `releases.json`.
- **Audit Classification**: **MOCKED**. Fails the core requirement of genuine NASA archive integration.

### 3.4 Repository 4: elsayedelmandoh/planetx-nasa26
- **Repository URL**: `https://github.com/elsayedelmandoh/planetx-nasa26`
- **Architecture**:
  - Utilizes IVOA SIA v2 endpoints (`https://irsa.ipac.caltech.edu/SIA`) with VOTable XML response parsing via Astropy (`astropy.io.votable.parse_single_table`).
  - Identifies that release `spherex_qr2` is superseded by `spherex_dr1` and `spherex_qr3`.
  - Includes real FITS test fixtures (`tests/fixtures/pass1.fits`, `pass2.fits`, `pass3.fits`).
  - Discovers practical archive realities: IRSA often returns HTTP 200 with text `"server busy"` bodies or times out after 60–120 seconds on dense spatial queries.
- **Audit Classification**: **VERIFIED (Spike)**. Valuable insight into SIA VOTable querying and retry backoff.

### 3.5 Additional Reference: FaizeenHoque/Orbital
- **Repository URL**: `https://github.com/FaizeenHoque/Orbital`
- **Architecture**:
  - Flask backend with requests to `https://irsa.ipac.caltech.edu/SIA` with `RESPONSEFORMAT=JSON`.
  - In-memory thread-safe LRU caching with size capping (`_image_cache`, `IMAGE_CACHE_BYTES=64MB`).
  - HiPS / Aladin Lite tile integration using CDS Strasbourg services (`https://alasky.cds.unistra.fr/SPHEREx`).
- **Audit Classification**: **VERIFIED**. Demonstrates practical dynamic caching and Aladin Lite integration.

---

## 4. Key Takeaways for Team CodeGenesis

1. **IRSA Architecture Reality**:
   - Synchronous TAP queries with complex spatial `JOIN` and unindexed `ORDER BY` frequently exceed HTTP gateway timeouts (45–90s) on dense fields.
   - Spatial queries must either omit arbitrary sorts, use indexed bounding boxes, or use asynchronous TAP (`/TAP/async`).
2. **True FITS Dimensionality**:
   - Real SPHEREx level-2 files are multi-extension FITS containing `IMAGE`, `FLAGS`, `VARIANCE`, `ZODI`, `EPSF`, and `WCS-WAVE`.
   - The 102 spectral bands must NEVER be collapsed into time frames. Each exposure corresponds to a single detector with an LVF wavelength gradient across the focal plane.
3. **Falsification & Honest Reporting**:
   - When a target has no public coverage in the active data release, the platform MUST explicitly display `INSUFFICIENT_COVERAGE` rather than silently replacing it with fake data.
