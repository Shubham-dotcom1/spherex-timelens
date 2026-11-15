# SPHEREx TimeLens – Scientific Validation Protocol
**Team CodeGenesis – NASA Space Apps Challenge 2026**
*Challenge: Planet X and SPHEREx*

---

## 1. Epistemological Framework: Karl Popper's Falsification Principle

In accordance with Karl Popper's *Logik der Forschung* (1934), scientific theories cannot be verified through inductive accumulation of confirmatory evidence; they can only be demarcated as scientific if they are **falsifiable**—capable of being refuted by empirical evidence.

In astronomical software and image processing:
- An intriguing image residual is **not** evidence of a transient or moving object.
- A flux variance across observations is **not** evidence of stellar variability.
- An unusual infrared spectrum is **not** evidence of a novel atmospheric molecule.

Every analytical capability in **SPHEREx TimeLens** is governed by explicit falsification tests, negative controls, variance propagation, and statistical significance criteria.

---

## 2. Hypothesis Formalization & Falsification Conditions

### Hypothesis 1 (H1): Observation Availability & Instrument Usability
* **Scientific Statement**: Genuine, usable SPHEREx Level-2 science observations exist covering the target celestial coordinates in the NASA/IPAC IRSA archive.
* **Empirical Test**:
  1. Formulate ADQL spatial query against `spherex.artifact` JOIN `spherex.plane` using `CONTAINS(POINT('ICRS', ra, dec), p.poly)`.
  2. Inspect time bounds (`p.time_bounds_lower`), energy bandpass (`p.energy_bandpassname`), and artifact URIs.
  3. Validate observation quality flags.
* **Falsification / Demarcation Criteria**:
  * If zero exposures cover the coordinates $\implies$ Hypothesis **REJECTED** (`INSUFFICIENT_COVERAGE`).
  * If exposures exist but flags indicate dead pixels, high spacecraft jitter, or saturation at the target centroid $\implies$ Hypothesis **QUALIFIED** (`UNSUITABLE_QUALITY`).
  * Scientific integrity rule: The application never generates synthetic observation counts for targets lacking public release coverage.

---

### Hypothesis 2 (H2): Moving-Object Astrometric Consistency
* **Scientific Statement**: A candidate moving source (e.g., Planet X, Kuiper Belt Object, asteroid, or high proper-motion star) exhibits positional displacement across epochs consistent with its predicted astrometric trajectory and incompatible with a stationary source.
* **Empirical Test**:
  1. Propagate predicted coordinates $(\alpha_{pred}(t_k), \delta_{pred}(t_k))$ taking into account proper motion $(\mu_\alpha \cos\delta, \mu_\delta)$ and parallax.
  2. Compute centroid offsets $\Delta \theta_k = \text{separation}\left((\alpha_{obs}, \delta_{obs}), (\alpha_{pred}, \delta_{pred})\right)$.
  3. Form the $\chi^2_{astrom}$ goodness-of-fit statistic:
     $$\chi^2_{astrom} = \sum_{k=1}^N \frac{(\Delta\theta_k)^2}{\sigma_{\theta,k}^2}$$
     where $\sigma_{\theta,k}$ includes both the SPHEREx centroiding uncertainty ($\sim 6.2'' / \text{SNR}$) and catalog positional uncertainties.
* **Falsification Criteria**:
  * If $\chi^2_{astrom} / \nu > 3.0$ with $p < 0.01 \implies$ Trajectory hypothesis **REJECTED**. The observed centroids are astrometrically inconsistent with the target model.
  * If observed displacement $\Delta\theta < 3\sigma_{\theta} \implies$ **REJECTED** (Stationary / Indistinguishable from background).

---

### Hypothesis 3 (H3): Multi-Epoch Difference Imaging Validity
* **Scientific Statement**: Calibrated image subtraction ($I_2 - I_1$) reveals genuine astronomical flux changes between epochs $t_1$ and $t_2$, rather than optical registration errors, PSF mismatches, or background subtraction artifacts.
* **Empirical Test**:
  1. Rigorous background estimation using 2D annular medians on both epochs.
  2. Sub-pixel spatial registration using `Cutout2D` and WCS coordinates.
  3. Variance propagation:
     $$\sigma_{diff}^2(x, y) = \sigma_1^2(x, y) + \sigma_2^2(x, y)$$
     derived directly from the SPHEREx `VARIANCE` HDU.
  4. Generation of the standardized significance map:
     $$S(x, y) = \frac{I_2(x, y) - I_1(x, y)}{\sigma_{diff}(x, y)}$$
  5. **Negative Control Verification**: Select 3 to 5 stationary control stars within the field. If control stars exhibit significant residuals ($|S| > 3\sigma$), the PSF registration is invalid.
* **Falsification Criteria**:
  * If reduced $\chi^2_\nu = \frac{1}{N_{pix}} \sum S(x, y)^2 > 2.5 \implies$ Subtraction method **REJECTED** (Excess systematic residual).
  * If candidate transient has $|S| < 5.0\sigma \implies$ **NON-DETECTION** (Fails 5-sigma discovery threshold).

---

### Hypothesis 4 (H4): Time-Domain Photometric Variability
* **Scientific Statement**: The measured source brightness changes over time beyond expected measurement uncertainties.
* **Null Hypothesis ($H_0$)**: The source has constant flux density: $F_\nu(t) = \bar{F}_\nu$.
* **Empirical Test**:
  1. Extract circular aperture flux $F_{ap}$ with background annulus subtraction:
     $$F_{source} = F_{ap} - A_{ap} \cdot \text{median}(I_{annulus})$$
  2. Compute variance $\sigma_F^2$ by integrating the `VARIANCE` HDU over the aperture.
  3. Test null hypothesis $H_0$ with $\chi^2$:
     $$\chi^2 = \sum_{k=1}^N \frac{(F_k - \bar{F})^2}{\sigma_{F,k}^2}, \quad \bar{F} = \frac{\sum F_k / \sigma_k^2}{\sum 1 / \sigma_k^2}$$
  4. Compute Welch-Stetson variability index $I$ or Stetson $J$.
* **Falsification Criteria**:
  * If $p\text{-value}(\chi^2, \nu = N - 1) \ge 0.01 \implies$ Null hypothesis **SUPPORTED** (Source is consistent with constant flux).
  * If $N < 5$ epochs $\implies$ **INSUFFICIENT_DATA** (Cadence too sparse to establish variability or period).

---

### Hypothesis 5 (H5): Spectral Feature Significance
* **Scientific Statement**: Spectral extraction over SPHEREx's 102 nominal channels reveals real astronomical absorption/emission features rather than detector fringing or calibration artifacts.
* **Empirical Test**:
  1. Interpolate pixel coordinates $(x, y)$ onto $(\lambda, \Delta\lambda)$ using the empirical `WCS-WAVE` HDU look-up table.
  2. Measure equivalent widths $W_\lambda$ and continuum fitting uncertainties.
  3. Check calibration flags in the `FLAGS` HDU (bitmask $0\times0001$ to $0\times8000$).
* **Falsification Criteria**:
  * If continuum SNR $< 5 \implies$ Spectral feature claims **REJECTED**.
  * If the feature coincides with detector edge effects or high variance flag pixels $\implies$ **REJECTED as Instrument Artifact**.

---

## 3. Mandatory Astronomical Benchmark Targets

| Target | RA (J2000) | Dec (J2000) | Primary Scientific Purpose | Popperian Status in SPHEREx DR1 |
|---|---|---|---|---|
| **Barnard's Star** | 17h57m48.5s | +04°41'36" | High proper motion astrometry ($\sim 10.3''/\text{yr}$) | **VERIFIED** (50 genuine observations in DR1) |
| **Epsilon Indi B** | 22h03m21.8s | -56°47'09" | Cold brown dwarf; binary Ba/Bb unresolved | **INSUFFICIENT_COVERAGE** in DR1 release |
| **WISE 0855-0714** | 08h55m10.8s | -07°14'42" | Coldest brown dwarf (250K); mover | **INSUFFICIENT_COVERAGE** in DR1 release |
| **RW Aurigae** | 05h07m49.7s | +30°24'05" | Classical T Tauri variable star | **INSUFFICIENT_COVERAGE** in DR1 release |
| **R Draconis** | 18h36m48.6s | +69°26'41" | Long-period Mira variable star | **INSUFFICIENT_COVERAGE** in DR1 release |
| **NEP Deep Field** | 18h01m19.6s | +66°33'41" | Deep survey calibration benchmark | **VERIFIED** (120+ observations in DR1) |

---

## 4. Reproducibility & Audit Trail
Every analytical result generated in SPHEREx TimeLens includes a cryptographically verifiable JSON execution manifest containing:
1. Exact UTC execution timestamp.
2. Input observation IDs and IRSA artifact URIs.
3. Astrometric parameters (aperture radii, annulus boundaries, detection thresholds).
4. Variance propagation outcomes and reduced $\chi^2$ values.
5. Falsification audit trail with explicit Popperian outcome codes.
