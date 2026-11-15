import React, { useState, useEffect } from 'react';
import { SpectrumResult, SpectrumPoint, SedTemplateMatch } from '../types';
import { extractSpectrum, fetchSedTemplates } from '../services/api';
import { Activity, RefreshCw, AlertCircle, Info, Sparkles, Filter, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface SpectralViewerProps {
  ra: number;
  dec: number;
  targetName: string;
}

const SPECTRAL_FEATURES = [
  { name: 'H₂O (Water)', wavelength: 1.40, color: '#38bdf8' },
  { name: 'H₂O (Water)', wavelength: 1.90, color: '#38bdf8' },
  { name: 'CH₄ (Methane)', wavelength: 2.20, color: '#f59e0b' },
  { name: 'CO (Carbon Monoxide)', wavelength: 2.30, color: '#fb7185' },
  { name: 'H₂O Ice', wavelength: 3.05, color: '#67e8f9' },
  { name: 'PAH / CH₄', wavelength: 3.30, color: '#a855f7' },
  { name: 'CO₂ Ice', wavelength: 4.26, color: '#34d399' },
  { name: 'CO Gas', wavelength: 4.67, color: '#f43f5e' },
];

const DETECTOR_BANDS = [
  { name: 'Band 1 (D1)', min: 0.75, max: 1.10, color: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8' },
  { name: 'Band 2 (D2)', min: 1.10, max: 1.62, color: 'rgba(99, 102, 241, 0.15)', border: '#6366f1' },
  { name: 'Band 3 (D3)', min: 1.63, max: 2.41, color: 'rgba(168, 85, 247, 0.15)', border: '#a855f7' },
  { name: 'Band 4 (D4)', min: 2.42, max: 3.82, color: 'rgba(236, 72, 153, 0.15)', border: '#ec4899' },
  { name: 'Band 5 (D5)', min: 3.83, max: 4.41, color: 'rgba(249, 115, 22, 0.15)', border: '#f97316' },
  { name: 'Band 6 (D6)', min: 4.42, max: 5.00, color: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
];

export const SpectralViewer: React.FC<SpectralViewerProps> = ({
  ra,
  dec,
  targetName,
}) => {
  const [spectrumData, setSpectrumData] = useState<SpectrumResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<SpectrumPoint | null>(null);
  const [showFeatureLines, setShowFeatureLines] = useState<boolean>(true);
  const [showBandRegions, setShowBandRegions] = useState<boolean>(true);

  // Standout Feature: Physical 4-Component SED Template Matching
  const [sedTemplates, setSedTemplates] = useState<SedTemplateMatch[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplateCurves, setShowTemplateCurves] = useState<boolean>(true);

  const loadSpectrum = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await extractSpectrum(ra, dec, targetName);
      setSpectrumData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to extract spectrum');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const templates = await fetchSedTemplates(ra, dec, targetName);
      setSedTemplates(templates);
      const best = templates.find((t) => t.is_best_fit);
      if (best) setSelectedTemplateId(best.template_id);
    } catch (err: any) {
      console.error('Failed to load SED templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadSpectrum();
    loadTemplates();
  }, [ra, dec, targetName]);

  const rawPoints = spectrumData?.points || (spectrumData as any)?.spectrum || [];
  const points: SpectrumPoint[] = rawPoints.map((p: any) => ({
    band_name: p.band_name || p.band || 'SPHEREx Band',
    detector: p.detector || 1,
    wavelength_um: p.wavelength_um || 1.0,
    delta_lambda_um: p.delta_lambda_um || 0.02,
    flux_mjy: p.flux_mjy || 0.0,
    flux_err_mjy: p.flux_err_mjy || 0.1,
    quality_flag: p.quality_flag !== undefined ? p.quality_flag : 0,
  }));

  // SVG Plot Bounds
  const plotWidth = 720;
  const plotHeight = 320;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };

  const minWave = 0.70;
  const maxWave = 5.10;

  const fluxes = points.map((p) => p.flux_mjy);
  const minFlux = fluxes.length > 0 ? Math.max(0, Math.min(...fluxes) * 0.8) : 0;
  const maxFlux = fluxes.length > 0 ? Math.max(...fluxes) * 1.25 : 100;

  const scaleX = (w: number) =>
    padding.left + ((w - minWave) / (maxWave - minWave)) * (plotWidth - padding.left - padding.right);
  const scaleY = (f: number) =>
    plotHeight - padding.bottom - ((f - minFlux) / (maxFlux - minFlux || 1)) * (plotHeight - padding.top - padding.bottom);

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            102-Band Infrared Spectroscopy & SED (H5 Validation)
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            0.75 – 5.00 µm
          </span>
          <button
            onClick={loadSpectrum}
            disabled={isLoading}
            className="p-1.5 bg-space-800 hover:bg-space-700 text-slate-300 rounded border border-space-700 transition"
            title="Refresh Spectrum"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Target & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-space-950 p-3 rounded-lg border border-space-800 text-xs font-mono">
        <div>
          <span className="text-slate-500">Target:</span>{' '}
          <strong className="text-slate-200">{targetName}</strong>{' '}
          <span className="text-slate-500">({ra.toFixed(4)}°, {dec.toFixed(4)}°)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Validation Status:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              spectrumData?.validation_status === 'SUPPORTED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {spectrumData?.validation_status || 'ANALYZING'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plot Controls */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showBandRegions}
              onChange={(e) => setShowBandRegions(e.target.checked)}
              className="accent-purple-400 rounded"
            />
            <span className="text-slate-300">Show SPHEREx D1–D6 Detector Boundaries</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showFeatureLines}
              onChange={(e) => setShowFeatureLines(e.target.checked)}
              className="accent-cyan-400 rounded"
            />
            <span className="text-slate-300">Show Molecular Absorption Markers (H₂O, CO₂, CO, Ice)</span>
          </label>
        </div>
        <span className="text-[11px] text-slate-500">R = λ/Δλ ≈ 41 – 135</span>
      </div>

      {/* Interactive SVG Spectrum Chart */}
      <div className="w-full bg-space-950 border border-space-800 rounded-lg p-2 overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${plotWidth} ${plotHeight}`}
          className="w-full h-auto min-w-[640px] select-none"
        >
          {/* Detector Band Regions */}
          {showBandRegions &&
            DETECTOR_BANDS.map((band) => {
              const x1 = scaleX(band.min);
              const x2 = scaleX(band.max);
              return (
                <g key={band.name}>
                  <rect
                    x={x1}
                    y={padding.top}
                    width={x2 - x1}
                    height={plotHeight - padding.top - padding.bottom}
                    fill={band.color}
                  />
                  <line
                    x1={x1}
                    y1={padding.top}
                    x2={x1}
                    y2={plotHeight - padding.bottom}
                    stroke={band.border}
                    strokeDasharray="2,2"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={padding.top + 14}
                    textAnchor="middle"
                    fill={band.border}
                    fontSize="9"
                    fontFamily="monospace"
                    opacity="0.8"
                  >
                    {band.name}
                  </text>
                </g>
              );
            })}

          {/* Molecular Absorption Feature Lines */}
          {showFeatureLines &&
            SPECTRAL_FEATURES.map((feat, idx) => {
              const x = scaleX(feat.wavelength);
              if (x < padding.left || x > plotWidth - padding.right) return null;
              return (
                <g key={`feat-${idx}`}>
                  <line
                    x1={x}
                    y1={padding.top + 20}
                    x2={x}
                    y2={plotHeight - padding.bottom}
                    stroke={feat.color}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.6"
                  />
                  <text
                    x={x}
                    y={padding.top + 28 + (idx % 2) * 12}
                    textAnchor="middle"
                    fill={feat.color}
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {feat.name} ({feat.wavelength}µm)
                  </text>
                </g>
              );
            })}

          {/* Axes */}
          {/* Y Axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={plotHeight - padding.bottom}
            stroke="#334155"
            strokeWidth="1"
          />
          {/* X Axis */}
          <line
            x1={padding.left}
            y1={plotHeight - padding.bottom}
            x2={plotWidth - padding.right}
            y2={plotHeight - padding.bottom}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* X Axis Ticks & Labels (Wavelength in µm) */}
          {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((w) => {
            const x = scaleX(w);
            return (
              <g key={`xtick-${w}`}>
                <line x1={x} y1={plotHeight - padding.bottom} x2={x} y2={plotHeight - padding.bottom + 4} stroke="#64748b" />
                <text
                  x={x}
                  y={plotHeight - padding.bottom + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {w.toFixed(1)}
                </text>
              </g>
            );
          })}
          <text
            x={(plotWidth + padding.left - padding.right) / 2}
            y={plotHeight - 12}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Observed Wavelength λ (µm)
          </text>

          {/* Y Axis Ticks & Labels (Flux in mJy) */}
          {[minFlux, (minFlux + maxFlux) / 2, maxFlux].map((f, i) => {
            const y = scaleY(f);
            return (
              <g key={`ytick-${i}`}>
                <line x1={padding.left - 4} y1={y} x2={padding.left} y2={y} stroke="#64748b" />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {f.toFixed(1)}
                </text>
              </g>
            );
          })}
          <text
            x={-plotHeight / 2}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Flux Density F_ν (mJy)
          </text>

          {/* Spectrum Continuous Curve */}
          {points.length > 1 && (
            <path
              d={points.reduce((path, pt, idx) => {
                const x = scaleX(pt.wavelength_um);
                const y = scaleY(pt.flux_mjy);
                return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2"
              className="drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]"
            />
          )}

          {/* Standout Feature: Active Physical SED Model Curve */}
          {showTemplateCurves && (() => {
            const activeTemplate = sedTemplates.find((t) => t.template_id === selectedTemplateId) || sedTemplates.find((t) => t.is_best_fit);
            if (!activeTemplate || activeTemplate.model_curve.length < 2) return null;
            return (
              <g>
                <path
                  d={activeTemplate.model_curve.reduce((path, pt, idx) => {
                    const x = scaleX(pt.wavelength_um);
                    const y = scaleY(pt.flux_mjy);
                    return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke={activeTemplate.template_id === 'planet_x_volatile_ice' ? '#f43f5e' : activeTemplate.template_id === 'cold_y_dwarf' ? '#a855f7' : '#f59e0b'}
                  strokeWidth="2"
                  strokeDasharray="5,4"
                  className="opacity-85"
                />
              </g>
            );
          })()}

          {/* Data Points with Error Bars */}
          {points.map((pt, idx) => {
            const x = scaleX(pt.wavelength_um);
            const y = scaleY(pt.flux_mjy);
            const yErrTop = scaleY(pt.flux_mjy + pt.flux_err_mjy);
            const yErrBottom = scaleY(Math.max(0, pt.flux_mjy - pt.flux_err_mjy));

            return (
              <g
                key={`pt-${idx}`}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                {/* Vertical Error Bar */}
                <line
                  x1={x}
                  y1={yErrTop}
                  x2={x}
                  y2={yErrBottom}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  opacity="0.7"
                />
                <line
                  x1={x - 2.5}
                  y1={yErrTop}
                  x2={x + 2.5}
                  y2={yErrTop}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  opacity="0.7"
                />
                <line
                  x1={x - 2.5}
                  y1={yErrBottom}
                  x2={x + 2.5}
                  y2={yErrBottom}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  opacity="0.7"
                />

                {/* Point Node */}
                <circle
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#00f0ff"
                  stroke="#0b111e"
                  strokeWidth="1.5"
                  className="hover:r-5 transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-space-900/95 backdrop-blur border border-cyan-500/40 rounded-lg p-3 text-xs font-mono shadow-xl pointer-events-none space-y-1">
            <div className="text-cyan-300 font-bold">{hoveredPoint.band_name}</div>
            <div className="text-slate-300">
              λ: <strong className="text-white">{hoveredPoint.wavelength_um.toFixed(3)} µm</strong> (±{hoveredPoint.delta_lambda_um.toFixed(3)})
            </div>
            <div className="text-slate-300">
              Flux: <strong className="text-cyan-400">{hoveredPoint.flux_mjy.toFixed(2)} mJy</strong> ± {hoveredPoint.flux_err_mjy.toFixed(2)}
            </div>
            <div className="text-slate-400 text-[10px]">
              Detector: D{hoveredPoint.detector} | Quality Flag: 0x{hoveredPoint.quality_flag.toString(16)}
            </div>
          </div>
        )}
      </div>

      {/* Physical SED 4-Component Template Fitting */}
      <div className="bg-space-950 p-4 rounded-lg border border-space-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-space-850">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-200">
              Physical SED Template Fitting & Chi-Squared Hypotheses Testing
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={showTemplateCurves}
                onChange={(e) => setShowTemplateCurves(e.target.checked)}
                className="accent-amber-400 rounded"
              />
              <span>Overlay Model Curve</span>
            </label>
            <button
              onClick={loadTemplates}
              disabled={isLoadingTemplates}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
              <span>Refit Models</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {sedTemplates.map((template) => {
            const isSelected = selectedTemplateId === template.template_id;
            return (
              <div
                key={template.template_id}
                onClick={() => setSelectedTemplateId(template.template_id)}
                className={`p-3 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-space-900 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-space-900/50 border-space-800 hover:border-space-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{template.template_name}</h4>
                    {template.is_best_fit && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        BEST FIT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 mb-2">
                    <span>χ²_ν: <strong className={template.reduced_chi2 < 2.0 ? 'text-emerald-400' : 'text-slate-300'}>{template.reduced_chi2.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>p: <strong className="text-slate-300">{template.p_value < 0.001 ? '<0.001' : template.p_value.toFixed(3)}</strong></span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {template.description}
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-space-800">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Key Diagnostics:</span>
                  <div className="flex flex-wrap gap-1">
                    {template.diagnostic_features.slice(0, 2).map((feat, fIdx) => (
                      <span
                        key={`diag-${template.template_id}-${fIdx}`}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-space-850 text-slate-300 border border-space-800"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popperian Scientific Notes */}
      <div className="p-3 bg-space-950/70 border border-space-800 rounded-lg text-xs font-mono text-slate-400">
        <span className="text-cyan-400 font-semibold">Popperian Methodological Note:</span>{' '}
        {spectrumData?.notes || 'SPHEREx derives 102 spectral bands through Linear Variable Filters (LVF). Points reflect calibrated flux within 6.2″ aperture.'}
      </div>
    </div>
  );
};
