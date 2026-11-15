import React, { useState, useEffect } from 'react';
import { LightCurveResult, LightCurvePoint } from '../types';
import { extractLightCurve } from '../services/api';
import { Orbit, RefreshCw, AlertCircle, TrendingUp, CheckCircle, HelpCircle } from 'lucide-react';

interface LightCurveViewerProps {
  ra: number;
  dec: number;
  targetName: string;
}

export const LightCurveViewer: React.FC<LightCurveViewerProps> = ({
  ra,
  dec,
  targetName,
}) => {
  const [lightCurveData, setLightCurveData] = useState<LightCurveResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBand, setSelectedBand] = useState<string>('SPHEREx-D4');
  const [hoveredPoint, setHoveredPoint] = useState<LightCurvePoint | null>(null);

  const loadLightCurve = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await extractLightCurve(ra, dec, targetName, selectedBand);
      setLightCurveData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to extract photometric light curve');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLightCurve();
  }, [ra, dec, targetName, selectedBand]);

  const rawPoints = lightCurveData?.points || (lightCurveData as any)?.lightcurve || [];
  const points: LightCurvePoint[] = rawPoints.map((p: any, idx: number) => ({
    obs_id: p.obs_id || `obs_${idx + 1}`,
    mjd: p.mjd || 60789,
    obs_date: p.obs_date || p.date || '2025-04-24',
    band: p.band || selectedBand,
    flux_mjy: p.flux_mjy || 0.0,
    flux_err_mjy: p.flux_err_mjy || 0.1,
    snr: p.snr || 10.0,
  }));

  // SVG Chart Dimensions
  const plotWidth = 720;
  const plotHeight = 300;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };

  const mjds = points.map((p) => p.mjd);
  const minMjd = mjds.length > 0 ? Math.min(...mjds) - 0.5 : 60789;
  const maxMjd = mjds.length > 0 ? Math.max(...mjds) + 0.5 : 60795;

  const fluxes = points.map((p) => p.flux_mjy);
  const minFlux = fluxes.length > 0 ? Math.max(0, Math.min(...fluxes) * 0.85) : 0;
  const maxFlux = fluxes.length > 0 ? Math.max(...fluxes) * 1.2 : 100;

  const scaleX = (mjd: number) =>
    padding.left + ((mjd - minMjd) / (maxMjd - minMjd || 1)) * (plotWidth - padding.left - padding.right);
  const scaleY = (f: number) =>
    plotHeight - padding.bottom - ((f - minFlux) / (maxFlux - minFlux || 1)) * (plotHeight - padding.top - padding.bottom);

  // Weighted mean flux for null hypothesis
  const meanFlux = fluxes.length > 0 ? fluxes.reduce((a, b) => a + b, 0) / fluxes.length : 0;

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <Orbit className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            Time-Domain Photometry & Light Curve (H4 Validation)
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedBand}
            onChange={(e) => setSelectedBand(e.target.value)}
            className="bg-space-950 border border-space-800 rounded px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="SPHEREx-D1">Band 1 (0.75 – 1.10 µm)</option>
            <option value="SPHEREx-D2">Band 2 (1.10 – 1.62 µm)</option>
            <option value="SPHEREx-D3">Band 3 (1.63 – 2.41 µm)</option>
            <option value="SPHEREx-D4">Band 4 (2.42 – 3.82 µm)</option>
            <option value="SPHEREx-D5">Band 5 (3.83 – 4.41 µm)</option>
            <option value="SPHEREx-D6">Band 6 (4.42 – 5.00 µm)</option>
          </select>
          <button
            onClick={loadLightCurve}
            disabled={isLoading}
            className="p-1.5 bg-space-800 hover:bg-space-700 text-slate-300 rounded border border-space-700 transition"
            title="Refresh Light Curve"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Target & Statistical Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-space-950 p-3 rounded-lg border border-space-800 font-mono text-xs">
        <div>
          <span className="text-slate-500 block text-[10px]">Target Object:</span>
          <span className="text-slate-200 font-semibold">{targetName}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Variability Outcome:</span>
          <span
            className={`font-bold ${
              lightCurveData?.is_variable ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {lightCurveData?.is_variable ? 'VARIABLE CANDIDATE' : 'CONSTANT / CONTROL'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Null Hyp. Constancy (p-value):</span>
          <span className="text-cyan-300">
            p = {lightCurveData?.p_value_constant !== undefined ? lightCurveData.p_value_constant.toFixed(4) : '—'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Variability Index (η):</span>
          <span className="text-purple-300">
            η = {lightCurveData?.variability_index !== undefined ? lightCurveData.variability_index.toFixed(3) : '—'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SVG Light Curve Chart */}
      <div className="w-full bg-space-950 border border-space-800 rounded-lg p-2 overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${plotWidth} ${plotHeight}`}
          className="w-full h-auto min-w-[640px] select-none"
        >
          {/* Constant Flux Baseline (Null Hypothesis H0) */}
          {meanFlux > 0 && (
            <g>
              <line
                x1={padding.left}
                y1={scaleY(meanFlux)}
                x2={plotWidth - padding.right}
                y2={scaleY(meanFlux)}
                stroke="#64748b"
                strokeDasharray="4,4"
                strokeWidth="1.2"
              />
              <text
                x={plotWidth - padding.right - 8}
                y={scaleY(meanFlux) - 6}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
              >
                H₀ Mean: {meanFlux.toFixed(2)} mJy
              </text>
            </g>
          )}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={plotHeight - padding.bottom}
            stroke="#334155"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={plotHeight - padding.bottom}
            x2={plotWidth - padding.right}
            y2={plotHeight - padding.bottom}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* X Axis (MJD) */}
          {points.map((p, idx) => {
            const x = scaleX(p.mjd);
            return (
              <g key={`x-${idx}`}>
                <line x1={x} y1={plotHeight - padding.bottom} x2={x} y2={plotHeight - padding.bottom + 4} stroke="#64748b" />
                <text
                  x={x}
                  y={plotHeight - padding.bottom + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {p.mjd.toFixed(1)}
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
            Observation Epoch (Modified Julian Date - MJD)
          </text>

          {/* Y Axis (Flux mJy) */}
          {[minFlux, (minFlux + maxFlux) / 2, maxFlux].map((f, i) => {
            const y = scaleY(f);
            return (
              <g key={`y-${i}`}>
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
            Calibrated Aperture Flux (mJy)
          </text>

          {/* Connecting Line */}
          {points.length > 1 && (
            <path
              d={points.reduce((path, pt, idx) => {
                const x = scaleX(pt.mjd);
                const y = scaleY(pt.flux_mjy);
                return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="2,2"
              opacity="0.6"
            />
          )}

          {/* Data Points with Error Bars */}
          {points.map((pt, idx) => {
            const x = scaleX(pt.mjd);
            const y = scaleY(pt.flux_mjy);
            const yErrTop = scaleY(pt.flux_mjy + pt.flux_err_mjy);
            const yErrBottom = scaleY(Math.max(0, pt.flux_mjy - pt.flux_err_mjy));

            return (
              <g
                key={`lc-pt-${idx}`}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                {/* Error bar */}
                <line x1={x} y1={yErrTop} x2={x} y2={yErrBottom} stroke="#fbbf24" strokeWidth="1.5" />
                <line x1={x - 3} y1={yErrTop} x2={x + 3} y2={yErrTop} stroke="#fbbf24" strokeWidth="1.5" />
                <line x1={x - 3} y1={yErrBottom} x2={x + 3} y2={yErrBottom} stroke="#fbbf24" strokeWidth="1.5" />

                {/* Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#f59e0b"
                  stroke="#0b111e"
                  strokeWidth="1.5"
                  className="hover:r-6 transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-space-900/95 backdrop-blur border border-amber-500/40 rounded-lg p-3 text-xs font-mono shadow-xl pointer-events-none space-y-1">
            <div className="text-amber-300 font-bold">{hoveredPoint.obs_date}</div>
            <div className="text-slate-300">
              MJD: <strong className="text-white">{hoveredPoint.mjd.toFixed(4)}</strong>
            </div>
            <div className="text-slate-300">
              Flux: <strong className="text-amber-400">{hoveredPoint.flux_mjy.toFixed(2)} mJy</strong> ± {hoveredPoint.flux_err_mjy.toFixed(2)}
            </div>
            <div className="text-slate-400 text-[10px]">
              SNR: {hoveredPoint.snr.toFixed(1)}σ | Obs: {hoveredPoint.obs_id.slice(0, 18)}
            </div>
          </div>
        )}
      </div>

      {/* Popperian Scientific Notes */}
      <div className="p-3 bg-space-950/70 border border-space-800 rounded-lg text-xs font-mono text-slate-400">
        <span className="text-amber-400 font-semibold">Popperian Falsification Criteria:</span>{' '}
        {lightCurveData?.notes || 'Null hypothesis H0 (constant flux) is rejected only if chi2 p-value < 0.01 across >= 5 temporal epochs.'}
      </div>
    </div>
  );
};
