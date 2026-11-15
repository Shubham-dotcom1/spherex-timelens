import {
  TargetPreset,
  ObservationRecord,
  PhotometryResult,
  DifferenceResult,
  SpectrumResult,
  LightCurveResult,
  PopperianReport,
  SystemHealth,
  InjectionRequest,
  InjectionResult,
  SedTemplateMatch,
  CatalogMatchResult,
  AuditCertificate,
  StackRequest,
  StackResult,
  MotionTrackRequest,
  MotionTrackResult,
  MovingObjectBenchmark,
  FieldCatalogSource,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTargets(): Promise<TargetPreset[]> {
  const res = await fetch(`${API_BASE}/targets`);
  if (!res.ok) throw new Error(`Failed to load target presets: ${res.statusText}`);
  return res.json();
}

export async function fetchSingleTarget(targetId: string): Promise<TargetPreset> {
  const res = await fetch(`${API_BASE}/targets/${targetId}`);
  if (!res.ok) throw new Error(`Failed to load target '${targetId}': ${res.statusText}`);
  return res.json();
}

export async function searchObservations(params: {
  ra?: number;
  dec?: number;
  coords?: string;
  radius_deg?: number;
  band?: string;
}): Promise<ObservationRecord[]> {
  const query = new URLSearchParams();
  if (params.coords) query.append('coords', params.coords);
  if (params.ra !== undefined) query.append('ra', params.ra.toString());
  if (params.dec !== undefined) query.append('dec', params.dec.toString());
  if (params.radius_deg !== undefined) query.append('radius_deg', params.radius_deg.toString());
  if (params.band) query.append('band', params.band);

  const res = await fetch(`${API_BASE}/observations?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to search observations');
  }
  return res.json();
}

export async function runPhotometry(payload: {
  obs_id: string;
  ra: number;
  dec: number;
  aperture_radius_arcsec?: number;
  inner_annulus_arcsec?: number;
  outer_annulus_arcsec?: number;
}): Promise<PhotometryResult> {
  const body = {
    ...payload,
    annulus_inner_arcsec: payload.inner_annulus_arcsec || 12.4,
    annulus_outer_arcsec: payload.outer_annulus_arcsec || 24.8,
  };
  const res = await fetch(`${API_BASE}/analysis/photometry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Photometry analysis failed');
  }
  return res.json();
}

export async function runDifferenceImaging(payload: {
  reference_obs_id: string;
  target_obs_id: string;
  ra: number;
  dec: number;
  box_size_pixels?: number;
  detection_threshold_sigma?: number;
}): Promise<DifferenceResult> {
  const body = {
    ...payload,
    obs_id_a: payload.reference_obs_id,
    obs_id_b: payload.target_obs_id,
    size_arcmin: ((payload.box_size_pixels || 512) * 6.2) / 60.0,
  };
  const res = await fetch(`${API_BASE}/analysis/difference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Difference imaging failed');
  }
  return res.json();
}

export async function extractSpectrum(ra: number, dec: number, targetName?: string): Promise<SpectrumResult> {
  const query = new URLSearchParams({
    ra: ra.toString(),
    dec: dec.toString(),
  });
  if (targetName) query.append('target_name', targetName);

  const res = await fetch(`${API_BASE}/analysis/spectrum?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Spectrum extraction failed');
  }
  return res.json();
}

export async function extractLightCurve(
  ra: number,
  dec: number,
  targetName?: string,
  band?: string
): Promise<LightCurveResult> {
  const query = new URLSearchParams({
    ra: ra.toString(),
    dec: dec.toString(),
  });
  if (targetName) query.append('target_name', targetName);
  if (band) query.append('band', band);

  const res = await fetch(`${API_BASE}/analysis/lightcurve?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Light curve extraction failed');
  }
  return res.json();
}

export async function generatePopperianReport(
  ra: number,
  dec: number,
  targetName: string,
  observationsCount: number
): Promise<PopperianReport> {
  const res = await fetch(`${API_BASE}/analysis/validation-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_name: targetName,
      ra,
      dec,
      observations_count: observationsCount,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Popperian validation report failed');
  }
  return res.json();
}

export async function injectSyntheticTarget(payload: InjectionRequest): Promise<InjectionResult> {
  const res = await fetch(`${API_BASE}/analysis/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Target injection failed');
  }
  return res.json();
}

export async function fetchSedTemplates(
  ra: number,
  dec: number,
  targetName?: string
): Promise<SedTemplateMatch[]> {
  const query = new URLSearchParams({
    ra: ra.toString(),
    dec: dec.toString(),
  });
  if (targetName) query.append('target_name', targetName);

  const res = await fetch(`${API_BASE}/analysis/sed-templates?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'SED template fitting failed');
  }
  return res.json();
}

export async function crossmatchCatalogs(
  ra: number,
  dec: number,
  radiusArcsec = 15.0
): Promise<CatalogMatchResult> {
  const query = new URLSearchParams({
    ra: ra.toString(),
    dec: dec.toString(),
    radius_arcsec: radiusArcsec.toString(),
  });

  const res = await fetch(`${API_BASE}/catalog/crossmatch?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Catalog cross-match failed');
  }
  return res.json();
}

export async function fetchAuditCertificate(
  targetName: string,
  ra: number,
  dec: number
): Promise<AuditCertificate> {
  const query = new URLSearchParams({
    target_name: targetName,
    ra: ra.toString(),
    dec: dec.toString(),
  });

  const res = await fetch(`${API_BASE}/analysis/audit-certificate?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Audit certificate generation failed');
  }
  return res.json();
}

export async function runCoaddStack(payload: StackRequest): Promise<StackResult> {
  const res = await fetch(`${API_BASE}/analysis/stack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Co-addition stacking failed');
  }
  return res.json();
}

export async function trackMotionTrajectory(payload: MotionTrackRequest): Promise<MotionTrackResult> {
  const res = await fetch(`${API_BASE}/analysis/motion-track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Motion tracking failed');
  }
  return res.json();
}

export async function fetchMovingBenchmarks(): Promise<MovingObjectBenchmark[]> {
  const res = await fetch(`${API_BASE}/analysis/moving-benchmarks`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to load moving benchmarks');
  }
  return res.json();
}

export async function fetchFieldCatalogSources(
  ra: number,
  dec: number,
  radiusArcmin = 10.0,
  boxSizePixels = 512
): Promise<FieldCatalogSource[]> {
  const query = new URLSearchParams({
    ra: ra.toString(),
    dec: dec.toString(),
    radius_arcmin: radiusArcmin.toString(),
    box_size_pixels: boxSizePixels.toString(),
  });

  const res = await fetch(`${API_BASE}/catalog/field-sources?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to fetch field catalog sources');
  }
  return res.json();
}
