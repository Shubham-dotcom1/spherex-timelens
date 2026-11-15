import csv
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import TargetPreset

router = APIRouter()

# Locate target_feasibility.csv robustly regardless of launch directory
_workspace_csv = Path(__file__).resolve().parents[3] / "target_feasibility.csv"
_local_csv = Path("target_feasibility.csv")
CSV_PATH = _workspace_csv if _workspace_csv.exists() else _local_csv

TARGET_METADATA = {
    "target-1-barnards-star": {
        "category": "astrometry",
        "ra_sexagesimal": "17h57m48.50s",
        "dec_sexagesimal": "+04°41'36.2\"",
        "pm_ra_mas_yr": -798.58,
        "pm_dec_mas_yr": 10328.12,
        "epoch": 2000.0,
        "description": "High proper motion M-dwarf star demonstrating astrometric displacement over time.",
        "scientific_context": "Barnard's Star exhibits the largest known stellar proper motion (~10.3 arcsec/yr). Multi-epoch observations test astrometric tracking and centroid stability.",
        "expected_feature": "Astrometric motion of ~0.028 arcsec/day",
    },
    "target-2-epsilon-indi-b": {
        "category": "brown-dwarf",
        "ra_sexagesimal": "22h03m21.80s",
        "dec_sexagesimal": "-56°47'09.0\"",
        "pm_ra_mas_yr": 3961.4,
        "pm_dec_mas_yr": -2538.3,
        "epoch": 2000.0,
        "description": "Binary brown dwarf system (Ba/Bb) tested as an unresolved source at SPHEREx resolution.",
        "scientific_context": "Close pair of T1 + T6 brown dwarfs. Note: unresolved at SPHEREx 6.2\"/pixel resolution.",
        "expected_feature": "Infrared methane and water vapor absorption",
    },
    "target-3-wise-0855": {
        "category": "brown-dwarf",
        "ra_sexagesimal": "08h55m10.83s",
        "dec_sexagesimal": "-07°14'42.5\"",
        "pm_ra_mas_yr": -8151.0,
        "pm_dec_mas_yr": 681.0,
        "epoch": 2000.0,
        "description": "Coldest known brown dwarf (Y dwarf, ~250 K) with large proper motion (~8.2 arcsec/yr).",
        "scientific_context": "Ultra-cold sub-stellar object. Peak emission in SPHEREx Band 5 (3.8-4.4 µm) and Band 6 (4.4-5.0 µm).",
        "expected_feature": "Water ice cloud signatures in 4-5 µm bands",
    },
    "target-4-rw-aurigae": {
        "category": "variable",
        "ra_sexagesimal": "05h07m49.70s",
        "dec_sexagesimal": "+30°24'05.0\"",
        "pm_ra_mas_yr": 1.5,
        "pm_dec_mas_yr": -19.4,
        "epoch": 2000.0,
        "description": "Classical T Tauri pre-main-sequence variable star exhibiting deep photometric dimming events.",
        "scientific_context": "Young stellar object with protoplanetary circumstellar disk. Undergoes dramatic multi-magnitude dimmings due to dust occultations.",
        "expected_feature": "Temporal flux variability and infrared silicate dust emission",
    },
    "target-5-r-draconis": {
        "category": "variable",
        "ra_sexagesimal": "18h36m48.60s",
        "dec_sexagesimal": "+69°26'41.0\"",
        "pm_ra_mas_yr": -12.8,
        "pm_dec_mas_yr": -1.9,
        "epoch": 2000.0,
        "description": "Long-period Mira pulsating variable star with large amplitude infrared variability (~245 days period).",
        "scientific_context": "Asymptotic Giant Branch (AGB) pulsating star. Excellent calibrator for long-term multi-epoch light curves.",
        "expected_feature": "Large-amplitude sinusoidal infrared pulsation",
    },
    "benchmark-nep": {
        "category": "benchmark",
        "ra_sexagesimal": "18h01m19.60s",
        "dec_sexagesimal": "+66°33'41.0\"",
        "pm_ra_mas_yr": 0.0,
        "pm_dec_mas_yr": 0.0,
        "epoch": 2000.0,
        "description": "North Ecliptic Pole deep survey field providing the dense ground-truth calibration benchmark.",
        "scientific_context": "Primary orbital pole repeatedly scanned during every orbit. Verified genuine multi-epoch coverage with full 65.8 MB level-2 FITS data.",
        "expected_feature": "Deep multi-epoch coverage across all 6 detector bands",
    },
    "showcase-sedna-planet-x": {
        "category": "planet-x",
        "ra_sexagesimal": "03h46m00.00s",
        "dec_sexagesimal": "+07°54'00.0\"",
        "pm_ra_mas_yr": -18.2,
        "pm_dec_mas_yr": -11.4,
        "epoch": 2000.0,
        "description": "Outer Solar System high-aphelion recovery sector designed for trans-Neptunian object & Planet X searches.",
        "scientific_context": "Deep infrared search for high-eccentricity trans-Neptunian objects and potential distant giant planets via characteristic solid-state CH4/CO2 ice absorption at 4.26 µm.",
        "expected_feature": "Methane & CO2 surface ice absorption signature at 4.26 µm; apparent daily motion ~1.2″/day",
    },
}

def load_targets() -> List[TargetPreset]:
    targets = []
    if CSV_PATH.exists():
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                target_id = row["id"]
                bands_list = [b.strip() for b in row.get("bands", "").split(";") if b.strip()]
                mjd_min = float(row["mjd_min"]) if row.get("mjd_min") and row["mjd_min"] != "N/A" else None
                mjd_max = float(row["mjd_max"]) if row.get("mjd_max") and row["mjd_max"] != "N/A" else None
                count = int(row.get("observation_count", 0).replace("+", "")) if row.get("observation_count") else 0
                
                ra_val = float(row["ra_deg"])
                dec_val = float(row["dec_deg"])
                meta = TARGET_METADATA.get(target_id, {})
                
                targets.append(TargetPreset(
                    id=target_id,
                    name=row["name"],
                    ra_deg=ra_val,
                    dec_deg=dec_val,
                    ra=ra_val,
                    dec=dec_val,
                    ra_sexagesimal=meta.get("ra_sexagesimal", f"{ra_val:.4f}°"),
                    dec_sexagesimal=meta.get("dec_sexagesimal", f"{dec_val:.4f}°"),
                    category=meta.get("category", "benchmark"),
                    description=meta.get("description", row.get("purpose", "")),
                    purpose=row.get("purpose", ""),
                    scientific_context=meta.get("scientific_context", row.get("notes", "")),
                    expected_feature=meta.get("expected_feature", ""),
                    pm_ra_mas_yr=meta.get("pm_ra_mas_yr", 0.0),
                    pm_dec_mas_yr=meta.get("pm_dec_mas_yr", 0.0),
                    epoch=meta.get("epoch", 2000.0),
                    status=row.get("status", "UNVERIFIED"),
                    observation_count=count,
                    bands=bands_list,
                    mjd_min=mjd_min,
                    mjd_max=mjd_max,
                    notes=row.get("notes", "")
                ))
    return targets

@router.get("/targets", response_model=List[TargetPreset])
def get_targets():
    """Returns all 5 mandatory targets plus NEP calibration benchmark."""
    targets = load_targets()
    return targets

@router.get("/targets/{target_id}", response_model=TargetPreset)
def get_target_by_id(target_id: str):
    """Returns target details by id."""
    targets = load_targets()
    for t in targets:
        if t.id == target_id:
            return t
    raise HTTPException(status_code=404, detail=f"Target '{target_id}' not found.")
