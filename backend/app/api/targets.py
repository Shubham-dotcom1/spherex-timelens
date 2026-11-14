import csv
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import TargetPreset

router = APIRouter()
CSV_PATH = Path("target_feasibility.csv")

def load_targets() -> List[TargetPreset]:
    targets = []
    if CSV_PATH.exists():
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                bands_list = [b.strip() for b in row.get("bands", "").split(";") if b.strip()]
                mjd_min = float(row["mjd_min"]) if row.get("mjd_min") and row["mjd_min"] != "N/A" else None
                mjd_max = float(row["mjd_max"]) if row.get("mjd_max") and row["mjd_max"] != "N/A" else None
                count = int(row.get("observation_count", 0).replace("+", "")) if row.get("observation_count") else 0
                
                targets.append(TargetPreset(
                    id=row["id"],
                    name=row["name"],
                    ra_deg=float(row["ra_deg"]),
                    dec_deg=float(row["dec_deg"]),
                    purpose=row.get("purpose", ""),
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
