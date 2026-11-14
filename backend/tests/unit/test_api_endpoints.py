import pytest
from starlette.testclient import TestClient
from backend.app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project"] == "SPHEREx TimeLens"
    assert data["status"] == "ONLINE"

def test_health_check(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"
    assert data["service"] == "SPHEREx TimeLens Scientific Backend"
    assert data["archive_status"] == "ONLINE"

def test_get_targets(client):
    resp = client.get("/api/targets")
    assert resp.status_code == 200
    targets = resp.json()
    assert len(targets) >= 5
    ids = [t["id"] for t in targets]
    assert "target-1-barnards-star" in ids
    assert "benchmark-nep" in ids

def test_get_single_target(client):
    resp = client.get("/api/targets/target-1-barnards-star")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Barnard's Star"
    assert data["status"] == "VERIFIED"
    assert data["observation_count"] == 50

def test_get_target_404(client):
    resp = client.get("/api/targets/non-existent-star")
    assert resp.status_code == 404

def test_search_observations_decimal(client):
    # Search around NEP
    resp = client.get("/api/observations?ra=270.3317&dec=66.5614&radius_deg=1.0")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    # Check required fields
    obs0 = data[0]
    assert "obs_id" in obs0
    assert "mjd" in obs0
    assert "detector" in obs0
    assert "band" in obs0

def test_search_observations_sexagesimal(client):
    # Barnard's star sexagesimal coordinates
    resp = client.get("/api/observations?coords=17h57m48.5s +04d41m36s")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0

def test_search_observations_invalid_coords(client):
    resp = client.get("/api/observations?ra=450.0&dec=0.0")
    assert resp.status_code == 422  # Pydantic validation error

def test_preview_image(client):
    resp = client.get("/api/preview/sample_level2_1D4")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert len(resp.content) > 1000

def test_cutout_metadata(client):
    resp = client.get("/api/cutout?obs_id=sample_level2_1D4&ra=270.203&dec=68.038&size_arcmin=15")
    assert resp.status_code == 200
    data = resp.json()
    assert data["obs_id"] == "sample_level2_1D4"
    assert data["pixel_width"] > 0
    assert data["pixel_scale_arcsec"] == 6.2

def test_photometry_endpoint(client):
    payload = {
        "obs_id": "sample_level2_1D4",
        "ra": 270.203021,
        "dec": 68.038062,
        "aperture_radius_arcsec": 6.2
    }
    resp = client.post("/api/analysis/photometry", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "flux_mjy" in data
    assert "flux_err_mjy" in data
    assert "snr" in data
    assert data["validation_status"] in ["SUPPORTED", "CANDIDATE_DETECTION", "NON_DETECTION", "INCONCLUSIVE"]

def test_difference_endpoint(client):
    payload = {
        "obs_id_a": "sample_level2_1D4",
        "obs_id_b": "sample_level2_1D4",
        "ra": 270.203021,
        "dec": 68.038062,
        "size_arcmin": 10.0
    }
    resp = client.post("/api/analysis/difference", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "max_significance_sigma" in data
    assert "difference_preview_url" in data

def test_spectrum_endpoint(client):
    resp = client.get("/api/analysis/spectrum?ra=270.3317&dec=66.5614")
    assert resp.status_code == 200
    data = resp.json()
    assert data["channels_extracted"] == 6
    assert len(data["spectrum"]) == 6

def test_lightcurve_endpoint(client):
    resp = client.get("/api/analysis/lightcurve?ra=270.3317&dec=66.5614&band=SPHEREx-D1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["epoch_count"] > 0
    assert len(data["lightcurve"]) > 0

def test_validation_report_endpoint(client):
    resp = client.get("/api/validation/target-1-barnards-star")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 3
    h_ids = [r["hypothesis_id"] for r in data]
    assert "H1" in h_ids
    assert "H2" in h_ids
    assert "H3" in h_ids
