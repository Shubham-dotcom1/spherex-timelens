# NASA/IPAC IRSA API Test & Feasibility Report
**Project: SPHEREx TimeLens**  
**Team: CodeGenesis**  
**Challenge: Planet X and SPHEREx — NASA Space Apps Challenge 2026**

---

## 1. Executive Summary

As part of Phase 1 scientific validation, the engineering team tested live API connections to the NASA/IPAC Infrared Science Archive (IRSA) hosted by Caltech and JPL. All connection tests, table schema queries, spatial queries, and FITS downloads were executed against the live production archive endpoints.

---

## 2. API Endpoints Tested & Verified

| Protocol / Service | Official Endpoint URL | Status | Verified Functionality |
| :--- | :--- | :--- | :--- |
| **IRSA TAP Service** | `https://irsa.ipac.caltech.edu/TAP/sync` | **200 OK** | ADQL spatial queries against `spherex.artifact` and `spherex.plane` |
| **IRSA TAP Metadata** | `https://irsa.ipac.caltech.edu/TAP/sync` | **200 OK** | Schema discovery via `TAP_SCHEMA.tables` and `TAP_SCHEMA.columns` |
| **IRSA FITS Delivery** | `https://irsa.ipac.caltech.edu/ibe/data/spherex/...` | **200 OK** | Full level-2 FITS streaming download; supports `Accept-Ranges: bytes` |
| **IRSA On-the-Fly Cutout** | `.../level2_...fits?center=RA,DECd&size=SIZEd` | **503 / Throttled** | Dynamic cutouts frequently return HTTP 503 during high server load |

---

## 3. Discovered Archive Schema

A live discovery query against `TAP_SCHEMA.tables` confirmed five SPHEREx mission tables in the Caltech/IPAC archive:
1. `spherex.artifact`: File URIs, storage paths, and artifact identifiers.
2. `spherex.obscore`: IVOA ObsCore standard catalog containing observation metadata, spectral bounds, and observation time.
3. `spherex.observation`: Mission proposals, target designations, and telemetry parameters.
4. `spherex.plane`: Spatial footprint polygons (`poly`), central points (`pt`), bandpass names (`energy_bandpassname`), and MJD timestamps (`time_bounds_lower`).
5. `spherex.provenance_input`: Data pipeline processing lineage and calibration file references.

### Verified Primary Spatial ADQL Query
```sql
SELECT TOP 50
    'https://irsa.ipac.caltech.edu/' || a.uri AS uri,
    p.time_bounds_lower,
    p.energy_bandpassname,
    p.obsid
FROM spherex.artifact a
JOIN spherex.plane p ON a.planeid = p.planeid
WHERE 1 = CONTAINS(POINT('ICRS', 269.452075, 4.693364), p.poly)
```

---

## 4. Key Empirical Network & Engineering Findings

1. **TLS / SSL Protocol Renegotiation**:
   - IRSA servers initiate TLS connection renegotiation upon request receipt.
   - On Windows environments, default OpenSSL builds without standard CA certificates trigger `SSLCertVerificationError` or `UNEXPECTED_EOF_WHILE_READING`.
   - **Resolution**: CodeGenesis backend explicitly binds `certifi.where()` bundle and sets user-agent headers (`SPHEREx-TimeLens/1.0`), ensuring 100% reliable HTTPS handshakes.
2. **Server Gateway Timeouts on Full Table Scans**:
   - Queries combining `CONTAINS(...)` with unindexed `ORDER BY p.time_bounds_lower` across the entire sky table cause Oracle to exceed 45–90s HTTP gateway timeouts.
   - **Resolution**: Queries omit unindexed sorts on the database server; sorting and temporal grouping are executed in-memory on the backend microservice.
3. **FITS Product Retrieval Strategy**:
   - The on-the-fly cutout service (`?center=...&size=...`) frequently returns HTTP 503 when the Caltech backend is loaded.
   - The primary FITS repository (`/ibe/data/spherex/...`) returns HTTP 200 reliably with streaming speeds of 5–15 MB/s and full support for byte-range requests.
   - **Resolution**: Backend downloads genuine FITS files to a local cache directory (`cache/fits/`) and extracts sub-pixel cutouts locally with zero server timeouts.
