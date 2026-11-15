# SPHEREx TimeLens – User & Researcher Guide
**Team CodeGenesis – NASA Space Apps Challenge 2026**

Welcome to **SPHEREx TimeLens**, an interactive scientific time-machine and research instrument designed to explore multi-epoch infrared observations from NASA's SPHEREx mission.

---

## 1. Getting Started

### 1.1 Sky Explorer & Preset Targets
1. Navigate to the **Sky Explorer** tab in the top navigation bar.
2. Select any of the **Mandatory Astronomical Targets**:
   - **Barnard's Star**: Demonstrates high proper motion ($\sim 10.3''/\text{yr}$) across 50 genuine observations in SPHEREx DR1.
   - **North Ecliptic Pole (NEP)**: NASA's deep survey calibration benchmark with 120+ exposures.
   - **Epsilon Indi B, WISE 0855, RW Aurigae, R Draconis**: Labeled with explicit Popperian indicators explaining that public Level-2 coverage is awaiting subsequent data releases.
3. Or enter arbitrary celestial coordinates in the **Coordinate Search Bar**:
   - Decimal degrees (e.g. `RA: 270.3317`, `Dec: +66.5614`)
   - Sexagesimal notation (e.g. `17h57m48.5s +04d41m36s`)
4. Adjust the search radius (0.10° to 2.50°) and choose whether to filter by specific detector bands (`SPHEREx-D1` through `SPHEREx-D6`).
5. Click **Execute IRSA Query** to query the NASA/IPAC IRSA TAP service.

---

## 2. Interactive Time Machine & Blink Comparator

### 2.1 Infrared Time Machine
1. Switch to the **Time Machine & Blink** tab.
2. Use the **Play Timelapse** button to animate through available observation epochs chronologically.
3. Adjust playback speed (0.5 to 8.0 FPS) or scrub along the **Timeline Scrubber** to inspect specific Modified Julian Dates (MJD).
4. The Epoch Status HUD displays:
   - Calendar Date and Time in UTC
   - MJD timestamp
   - Baseline time delta $\Delta t$ in days since the initial exposure
   - Detector band and nominal wavelength range

### 2.2 Tombaugh Blink Comparator
1. Scroll down to the **Astronomical Blink Comparator** section.
2. Select **Epoch A** (Reference) and **Epoch B** (Target) from the dropdown menus.
3. The viewer alternates between Epoch A and Epoch B at your chosen cadence (200 ms to 1000 ms).
4. Watch the central alignment reticle:
   - Stationary background stars remain stationary.
   - Any high proper-motion object (like Barnard's Star or WISE 0855) or transient will visibly jump or pulse!
5. Use the **Toggle A / B** button to step manually between frames.

---

## 3. Scientific Difference Imaging

1. Switch to the **Image Subtraction** tab.
2. Select the Reference Epoch ($I_1$) and Target Epoch ($I_2$).
3. Click **Compute Difference**.
4. Explore the resulting views:
   - **Residual Map ($I_2 - I_1$)**: Calibrated difference image in $MJy/sr$.
   - **Significance Map ($\sigma$)**: Standardized map $[I_2 - I_1] / \sigma_{diff}$ scaled by the combined variance.
   - **Side-by-Side**: Direct visual comparison of $I_1$ and $I_2$.
5. Inspect the **H3 Popperian Subtraction Audit**:
   - RMS Residual ($MJy/sr$)
   - Reduced Chi-Square ($\chi^2/\nu$)
   - $5\sigma$ Transient Candidate count
   - Estimated False Positive Rate

---

## 4. 102-Band Infrared Spectroscopy

1. Switch to the **102 Spectral Bands** tab.
2. The viewer plots the Spectral Energy Distribution (SED) curve ($F_\nu$ in mJy vs observed wavelength $\lambda$ in $\mu m$).
3. Toggle features:
   - **SPHEREx D1–D6 Detector Boundaries**: Highlights the wavelength coverage of each linear variable filter.
   - **Molecular Absorption Markers**: Displays key astronomical spectral lines, including $H_2O$ (1.4, 1.9, 3.05 $\mu m$ ice), $CH_4$ (2.2, 3.3 $\mu m$), $CO$ (2.3, 4.67 $\mu m$), and $CO_2$ ice (4.26 $\mu m$).
4. Hover over data points to inspect local resolving power ($R \approx 41 - 135$), flux uncertainties, and bitmask quality flags.

---

## 5. Time-Domain Photometry & Light Curves

1. Switch to the **Photometry & Variability** tab.
2. Select a detector band (`SPHEREx-D1` to `SPHEREx-D6`).
3. The interactive light curve plots flux density against Modified Julian Date.
4. Error bars are propagated from the SPHEREx `VARIANCE` HDU.
5. The dashed horizontal line represents the Constant Source Null Hypothesis ($H_0$).
6. Review the $\chi^2$ p-value and variability index ($\eta$) to verify whether the source is a variable candidate or a stationary control star.

---

## 6. Karl Popper Scientific Falsification Matrix

1. Switch to the **Falsification Matrix** tab.
2. View the audit cards for Hypotheses H1 through H5:
   - **H1**: Observation Availability & Quality
   - **H2**: Moving-Object Astrometric Consistency
   - **H3**: Difference Imaging Reliability
   - **H4**: Time-Domain Photometric Variability
   - **H5**: Spectral Feature Integrity
3. Every card documents the empirical evidence, falsification criteria, test outcome, and reproducibility protocol.
