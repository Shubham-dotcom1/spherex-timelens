import os
import csv
import time
import requests

TARGETS = [
    {
        "id": "target-1-barnards-star",
        "name": "Barnard's Star",
        "ra_deg": 269.452075,
        "dec_deg": 4.693364,
        "purpose": "High proper-motion demonstration, Astrometric tracking",
        "notes": "Starting coordinates J2000. Large PM ~10.39 arcsec/yr."
    },
    {
        "id": "target-2-epsilon-indi-b",
        "name": "Epsilon Indi B",
        "ra_deg": 330.840208,
        "dec_deg": -56.785972,
        "purpose": "Brown-dwarf infrared characterization, Unresolved binary pair",
        "notes": "Epsilon Indi Ba and Bb close pair. SPHEREx does not resolve individually."
    },
    {
        "id": "target-3-wise-0855",
        "name": "WISE 0855",
        "ra_deg": 133.795129,
        "dec_deg": -7.245147,
        "purpose": "High proper-motion brown dwarf, Cold-object infrared characterization",
        "notes": "Fast mover, coldest known Y dwarf (~250 K)."
    },
    {
        "id": "target-4-rw-aurigae",
        "name": "RW Aurigae",
        "ra_deg": 76.956083,
        "dec_deg": 30.401325,
        "purpose": "Variable-star investigation, Flux measurement",
        "notes": "Classical T Tauri pre-main-sequence binary system."
    },
    {
        "id": "target-5-r-draconis",
        "name": "R Draconis",
        "ra_deg": 248.167625,
        "dec_deg": 66.754972,
        "purpose": "Long-period variable-star investigation, Light curve",
        "notes": "Mira variable. High northern declination."
    },
    # Also add NEP Deep Field as ground truth benchmark
    {
        "id": "benchmark-nep",
        "name": "North Ecliptic Pole (NEP)",
        "ra_deg": 270.3317,
        "dec_deg": 66.5614,
        "purpose": "Deep survey field, Multi-epoch verification benchmark",
        "notes": "Dense coverage across multiple epochs and detectors."
    }
]

IRSA_TAP_URL = "https://irsa.ipac.caltech.edu/TAP/sync"

def query_target_tap(ra: float, dec: float, max_files: int = 50, timeout: int = 90):
    """Queries IRSA TAP for spherex observations overlapping the coordinate."""
    # Query spherex.artifact and spherex.plane
    q = f"""
    SELECT TOP {max_files}
        'https://irsa.ipac.caltech.edu/' || a.uri AS uri,
        p.time_bounds_lower,
        p.energy_bandpassname,
        p.obsid
    FROM spherex.artifact a
    JOIN spherex.plane p ON a.planeid = p.planeid
    WHERE 1 = CONTAINS(POINT('ICRS', {ra:.6f}, {dec:.6f}), p.poly)
    ORDER BY p.time_bounds_lower
    """.strip()
    
    headers = {"User-Agent": "SPHEREx-TimeLens-Feasibility/1.0"}
    try:
        resp = requests.post(
            IRSA_TAP_URL,
            data={"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": q},
            headers=headers,
            timeout=timeout
        )
        if resp.status_code != 200:
            return {"status": f"HTTP_{resp.status_code}", "rows": [], "error": resp.text[:200]}
        
        lines = [line.strip() for line in resp.text.strip().split("\n") if line.strip()]
        if len(lines) <= 1:
            return {"status": "NO_COVERAGE", "rows": [], "count": 0}
        
        reader = csv.DictReader(lines)
        rows = list(reader)
        return {"status": "SUCCESS", "rows": rows, "count": len(rows)}
    except Exception as e:
        return {"status": "ERROR", "rows": [], "error": str(e)[:150]}

print("Starting Target Feasibility Survey against NASA/IPAC IRSA TAP...")
results = []

for t in TARGETS:
    print(f"\nQuerying {t['name']} (RA: {t['ra_deg']}, Dec: {t['dec_deg']})...")
    res = query_target_tap(t["ra_deg"], t["dec_deg"])
    
    status = res.get("status")
    count = res.get("count", 0)
    rows = res.get("rows", [])
    
    if count > 0:
        mjds = [float(r["time_bounds_lower"]) for r in rows if r.get("time_bounds_lower")]
        bands = sorted(list(set(r.get("energy_bandpassname", "") for r in rows if r.get("energy_bandpassname"))))
        mjd_min = min(mjds) if mjds else "N/A"
        mjd_max = max(mjds) if mjds else "N/A"
        print(f"  -> Found {count} observations! Bands: {bands}, MJD: {mjd_min} to {mjd_max}")
    else:
        mjd_min = "N/A"
        mjd_max = "N/A"
        bands = []
        print(f"  -> Status: {status} (Count: 0)")
        if "error" in res:
            print(f"     Error detail: {res['error']}")
            
    results.append({
        "id": t["id"],
        "name": t["name"],
        "ra_deg": t["ra_deg"],
        "dec_deg": t["dec_deg"],
        "status": status,
        "observation_count": count,
        "bands": ";".join(bands),
        "mjd_min": mjd_min,
        "mjd_max": mjd_max,
        "purpose": t["purpose"],
        "notes": t["notes"]
    })
    time.sleep(2)  # Polite pause between queries

# Save to target_feasibility.csv
csv_path = "target_feasibility.csv"
fieldnames = ["id", "name", "ra_deg", "dec_deg", "status", "observation_count", "bands", "mjd_min", "mjd_max", "purpose", "notes"]

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in results:
        writer.writerow(r)

print(f"\nSaved target feasibility results to {csv_path}!")
