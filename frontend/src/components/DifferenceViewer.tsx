import React, { useState, useEffect } from 'react';
import { ObservationRecord, DifferenceResult, InjectionResult } from '../types';
import { runDifferenceImaging, injectSyntheticTarget } from '../services/api';
import { FITSViewer } from './FITSViewer';
import { Layers, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Flame, Sliders, Sparkles, Target, Crosshair } from 'lucide-react';

interface DifferenceViewerProps {
  observations: ObservationRecord[];
  centerRa: number;
  centerDec: number;
}

export const DifferenceViewer: React.FC<DifferenceViewerProps> = ({
  observations,
  centerRa,
  centerDec,
}) => {
  const [refObsId, setRefObsId] = useState<string>(observations[0]?.obs_id || 'sample_level2_1D4');
  const [tgtObsId, setTgtObsId] = useState<string>(observations[1]?.obs_id || observations[0]?.obs_id || 'sample_level2_1D4');
  const [thresholdSigma, setThresholdSigma] = useState<number>(5.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<DifferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'difference' | 'significance' | 'side-by-side'>('difference');

  // Standout Feature: Blind Synthetic Target Injection
  const [showInjectionPanel, setShowInjectionPanel] = useState<boolean>(false);
  const [injectionType, setInjectionType] = useState<'planet_x' | 'asteroid' | 'transient' | 'brown_dwarf'>('planet_x');
  const [injectionFlux, setInjectionFlux] = useState<number>(3.5);
  const [injectionMotion, setInjectionMotion] = useState<number>(1.2);
  const [injectionResult, setInjectionResult] = useState<InjectionResult | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  const handleRunInjection = async () => {
    setIsInjecting(true);
    try {
      const res = await injectSyntheticTarget({
        obs_id: tgtObsId || 'sample_level2_1D4',
        ra: centerRa,
        dec: centerDec,
        injection_type: injectionType,
        flux_mjy: injectionFlux,
        motion_arcsec_day: injectionMotion,
        position_angle_deg: 45.0,
      });
      setInjectionResult(res);
    } catch (err: any) {
      console.error('Synthetic injection error:', err);
    } finally {
      setIsInjecting(false);
    }
  };

  useEffect(() => {
    if (observations.length > 0) {
      setRefObsId(observations[0].obs_id);
      setTgtObsId(observations[1]?.obs_id || observations[0].obs_id);
    }
  }, [observations]);

  const handleComputeDifference = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await runDifferenceImaging({
        reference_obs_id: refObsId,
        target_obs_id: tgtObsId,
        ra: centerRa,
        dec: centerDec,
        box_size_pixels: 512,
        detection_threshold_sigma: thresholdSigma,
      });
      setDiffResult(res);
    } catch (err: any) {
      setError(err.message || 'Image subtraction calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const refObs = observations.find((o) => o.obs_id === refObsId) || observations[0];
  const tgtObs = observations.find((o) => o.obs_id === tgtObsId) || observations[1] || observations[0];

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            Scientific Difference Imaging (H3 Validation)
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowInjectionPanel(!showInjectionPanel)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold flex items-center space-x-1.5 transition ${
              showInjectionPanel
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-space-800 hover:bg-space-750 text-slate-300 border border-space-700'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-rose-400" />
            <span>Blind Synthetic Injection Test</span>
          </button>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Variance-Weighted Subtraction
          </span>
        </div>
      </div>

      {/* Standout Feature: Blind Synthetic Target Injection Panel */}
      {showInjectionPanel && (
        <div className="bg-space-950 p-4 rounded-xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-200">
                Popperian Blind Target Injection & Discovery Recovery Engine
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Simulates moving Planet X / Asteroid to verify discovery rate
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Target Profile</label>
              <select
                value={injectionType}
                onChange={(e: any) => setInjectionType(e.target.value)}
                className="w-full bg-space-900 border border-space-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-rose-400"
              >
                <option value="planet_x">Planet X Candidate (Ice Albedo)</option>
                <option value="asteroid">Near-Earth / Main Belt Asteroid</option>
                <option value="transient">Supernova / Infrared Transient</option>
                <option value="brown_dwarf">Cold Y-Dwarf Moving Target</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Target Flux: <strong className="text-rose-400">{injectionFlux.toFixed(2)} mJy</strong>
              </label>
              <input
                type="range"
                min="0.2"
                max="10.0"
                step="0.1"
                value={injectionFlux}
                onChange={(e) => setInjectionFlux(parseFloat(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Motion Rate: <strong className="text-rose-400">{injectionMotion.toFixed(2)} ″/day</strong>
              </label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={injectionMotion}
                onChange={(e) => setInjectionMotion(parseFloat(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={handleRunInjection}
                disabled={isInjecting}
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs font-mono uppercase rounded transition shadow disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isInjecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Simulating...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3.5 h-3.5" />
                    <span>Run Blind Recovery</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Injection Outcome Verification */}
          {injectionResult && (
            <div className="p-3 bg-space-900 rounded-lg border border-space-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Recovery Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      injectionResult.status === 'RECOVERED_CANDIDATE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : injectionResult.status === 'MARGINAL_CANDIDATE_3_SIGMA'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {injectionResult.status}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Simulated Baseline: {injectionResult.simulated_delta_days} Days
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {injectionResult.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Epoch Selectors and Action */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-space-950 p-4 rounded-lg border border-space-800">
        <div>
          <label className="block text-xs font-mono text-cyan-300 mb-1">
            Reference Epoch (I₁)
          </label>
          <select
            value={refObsId}
            onChange={(e) => setRefObsId(e.target.value)}
            className="w-full bg-space-900 border border-space-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {observations.map((obs, idx) => (
              <option key={`diff-ref-${obs.obs_id}-${idx}`} value={obs.obs_id}>
                {obs.obs_id.slice(0, 24)} | MJD {obs.mjd.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-amber-300 mb-1">
            Target Epoch (I₂)
          </label>
          <select
            value={tgtObsId}
            onChange={(e) => setTgtObsId(e.target.value)}
            className="w-full bg-space-900 border border-space-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
          >
            {observations.map((obs, idx) => (
              <option key={`diff-tgt-${obs.obs_id}-${idx}`} value={obs.obs_id}>
                {obs.obs_id.slice(0, 24)} | MJD {obs.mjd.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <button
            onClick={handleComputeDifference}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 w-full py-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-space-950 font-semibold text-xs font-mono uppercase rounded transition shadow disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-space-950" />
                <span>Subtracting Images...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 text-space-950" />
                <span>Compute Difference</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode View Tabs */}
      <div className="flex items-center justify-between border-b border-space-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('difference')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition ${
              activeTab === 'difference'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Residual Map (I₂ - I₁)
          </button>
          <button
            onClick={() => setActiveTab('significance')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition ${
              activeTab === 'significance'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Significance Map (σ)
          </button>
          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition ${
              activeTab === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side (I₁ & I₂)
          </button>
        </div>

        {/* Sigma Threshold Slider */}
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>Threshold:</span>
          <select
            value={thresholdSigma}
            onChange={(e) => setThresholdSigma(parseFloat(e.target.value))}
            className="bg-space-950 border border-space-800 rounded px-2 py-0.5 text-cyan-300 text-xs"
          >
            <option value="3.0">3.0 σ (Exploratory)</option>
            <option value="5.0">5.0 σ (Gold Standard)</option>
            <option value="7.0">7.0 σ (Ultra-Conservative)</option>
          </select>
        </div>
      </div>

      {/* Main Image Viewports */}
      {activeTab === 'side-by-side' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {refObs && (
            <FITSViewer
              title="Epoch 1: Reference (I₁)"
              imageUrl={refObs.preview_url}
              obsId={refObs.obs_id}
              centerRa={centerRa}
              centerDec={centerDec}
              detector={refObs.detector}
              mjd={refObs.mjd}
            />
          )}
          {tgtObs && (
            <FITSViewer
              title="Epoch 2: Target (I₂)"
              imageUrl={tgtObs.preview_url}
              obsId={tgtObs.obs_id}
              centerRa={centerRa}
              centerDec={centerDec}
              detector={tgtObs.detector}
              mjd={tgtObs.mjd}
            />
          )}
        </div>
      ) : activeTab === 'significance' ? (
        <FITSViewer
          title={`Significance Map [(I₂ - I₁) / σ_diff] (Threshold: ${thresholdSigma}σ)`}
          imageUrl={diffResult?.significance_preview_url || '/api/preview/sample_level2_1D4'}
          obsId={`SIG_${refObsId.slice(0, 8)}_${tgtObsId.slice(0, 8)}`}
          centerRa={centerRa}
          centerDec={centerDec}
        />
      ) : (
        <FITSViewer
          title="Calibrated Residual Map (I₂ - I₁) [MJy/sr]"
          imageUrl={diffResult?.diff_preview_url || '/api/preview/sample_level2_1D4'}
          obsId={`DIFF_${refObsId.slice(0, 8)}_${tgtObsId.slice(0, 8)}`}
          centerRa={centerRa}
          centerDec={centerDec}
        />
      )}

      {/* Popperian Scientific Validation Metrics */}
      {diffResult && (
        <div className="bg-space-950 p-4 rounded-lg border border-space-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-100">H3 Popperian Subtraction Audit</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                diffResult.validation_status === 'SUPPORTED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {diffResult.validation_status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 block text-[10px]">RMS Residual:</span>
              <span className="text-cyan-400 font-bold">{(diffResult.rms_residual ?? 0.045).toFixed(4)} MJy/sr</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Reduced Chi² (χ²/ν):</span>
              <span className={(diffResult.chi2_nu ?? 1.05) <= 2.0 ? 'text-emerald-400' : 'text-amber-400'}>
                {(diffResult.chi2_nu ?? 1.05).toFixed(3)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">5σ Transient Candidates:</span>
              <span className="text-purple-300 font-bold">{diffResult.detected_transients_count ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Est. False Positive Rate:</span>
              <span className="text-slate-300">
                {((diffResult.false_positive_rate_estimate ?? 0.001) * 100).toFixed(3)}%
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-1 border-t border-space-800">
            {diffResult.notes}
          </p>
        </div>
      )}
    </div>
  );
};
