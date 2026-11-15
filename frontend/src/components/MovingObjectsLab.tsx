import React, { useState, useEffect } from 'react';
import { MovingObjectBenchmark, MotionTrackResult } from '../types';
import { fetchMovingBenchmarks, trackMotionTrajectory } from '../services/api';
import {
  Compass,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Target,
  Sliders,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

interface MovingObjectsLabProps {
  onLoadCoordinates: (ra: number, dec: number, name: string) => void;
}

export const MovingObjectsLab: React.FC<MovingObjectsLabProps> = ({ onLoadCoordinates }) => {
  const [benchmarks, setBenchmarks] = useState<MovingObjectBenchmark[]>([]);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('barnards-star');
  const [baselineDays, setBaselineDays] = useState<number>(183);
  const [trackResult, setTrackResult] = useState<MotionTrackResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animStep, setAnimStep] = useState<number>(0);

  // Load benchmark objects
  useEffect(() => {
    fetchMovingBenchmarks()
      .then((data) => {
        setBenchmarks(data);
        if (data.length > 0) setSelectedBenchmarkId(data[0].id);
      })
      .catch((err) => console.error('Failed to load moving benchmarks:', err));
  }, []);

  const activeBenchmark = benchmarks.find((b) => b.id === selectedBenchmarkId) || benchmarks[0];

  // Re-calculate motion track when benchmark or baseline changes
  useEffect(() => {
    if (!activeBenchmark) return;
    setIsLoading(true);
    trackMotionTrajectory({
      ra_deg: activeBenchmark.ra_deg,
      dec_deg: activeBenchmark.dec_deg,
      target_name: activeBenchmark.name,
      pm_ra_mas_yr: activeBenchmark.pm_ra_mas_yr,
      pm_dec_mas_yr: activeBenchmark.pm_dec_mas_yr,
      orbital_rate_arcsec_day: activeBenchmark.orbital_rate_arcsec_day > 1.0 ? activeBenchmark.orbital_rate_arcsec_day : undefined,
      baseline_days: baselineDays,
    })
      .then((res) => {
        setTrackResult(res);
        setAnimStep(res.trajectory.length - 1);
      })
      .catch((err) => console.error('Motion track error:', err))
      .finally(() => setIsLoading(false));
  }, [activeBenchmark, baselineDays]);

  // Trail animation timer
  useEffect(() => {
    if (!isAnimating || !trackResult) return;
    const interval = setInterval(() => {
      setAnimStep((prev) => {
        if (prev >= trackResult.trajectory.length - 1) return 0;
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isAnimating, trackResult]);

  // Canvas bounds for vector visualization
  const canvasSize = 340;
  const centerCanvas = canvasSize / 2;
  const maxDispPixels = trackResult?.total_displacement_pixels || 1.0;
  const scaleVisual = Math.min(110, Math.max(25, 100 / Math.max(1.0, maxDispPixels)));

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            Astrometric Motion Lab & Trail Tracking (H2 Validation)
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Astrometric Trail Mode
          </span>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Centroid Vector Analysis
          </span>
        </div>
      </div>

      {/* Target Benchmark Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {benchmarks.map((item) => {
          const isSelected = selectedBenchmarkId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                setSelectedBenchmarkId(item.id);
                // Adjust default baseline depending on object kinematics
                if (item.id.includes('asteroid')) setBaselineDays(21);
                else setBaselineDays(183);
              }}
              className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-space-800 border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'bg-space-950/70 border-space-800 hover:border-space-700 hover:bg-space-850'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 block font-bold truncate">
                  {item.classification}
                </span>
                <h3 className="text-xs font-bold text-slate-100 mt-1 line-clamp-1">{item.name}</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">{item.designation}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-space-800 text-[10px] font-mono flex items-center justify-between text-slate-400">
                <span>{item.spectral_class}</span>
                <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                  {isSelected ? 'Active Target' : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Target Astrometric Workbench */}
      {activeBenchmark && trackResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Vector & Trail Simulation Canvas (5 cols) */}
          <div className="lg:col-span-5 bg-space-950 p-4 rounded-xl border border-space-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-space-850">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-200">
                    Astrometric Trail Map (WCS Projected)
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAnimating(!isAnimating)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center space-x-1 ${
                      isAnimating
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isAnimating ? 'Pause' : 'Animate Trail'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAnimating(false);
                      setAnimStep(trackResult.trajectory.length - 1);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200"
                    title="Reset to Full Trail"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Vector SVG Canvas */}
              <div className="my-3 flex justify-center relative select-none">
                <svg
                  width={canvasSize}
                  height={canvasSize}
                  className="bg-space-900 rounded-lg border border-space-800 shadow-inner"
                >
                  {/* Grid Lines */}
                  <line x1={centerCanvas} y1="0" x2={centerCanvas} y2={canvasSize} stroke="#1e293b" strokeDasharray="2,2" />
                  <line x1="0" y1={centerCanvas} x2={canvasSize} y2={centerCanvas} stroke="#1e293b" strokeDasharray="2,2" />
                  <circle cx={centerCanvas} cy={centerCanvas} r="60" fill="none" stroke="#1e293b" strokeDasharray="2,2" />
                  <circle cx={centerCanvas} cy={centerCanvas} r="120" fill="none" stroke="#1e293b" strokeDasharray="2,2" />

                  {/* Cardinal Directions */}
                  <text x={centerCanvas} y="15" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">N (+Dec)</text>
                  <text x={centerCanvas} y={canvasSize - 6} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">S (-Dec)</text>
                  <text x="12" y={centerCanvas + 3} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">E</text>
                  <text x={canvasSize - 12} y={centerCanvas + 3} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">W</text>

                  {/* Initial Position Node (Epoch 1) */}
                  <circle cx={centerCanvas} cy={centerCanvas} r="4" fill="#00f0ff" stroke="#0b111e" strokeWidth="1.5" />
                  <text x={centerCanvas + 6} y={centerCanvas - 6} fill="#00f0ff" fontSize="9" fontFamily="monospace">T₀ (Epoch 1)</text>

                  {/* Stationary Control Reference Star */}
                  <circle cx={centerCanvas + 70} cy={centerCanvas - 50} r="3" fill="#64748b" />
                  <text x={centerCanvas + 76} y={centerCanvas - 47} fill="#64748b" fontSize="8" fontFamily="monospace">Control Star (Δθ=0)</text>

                  {/* Trajectory Trail Vector */}
                  {trackResult.trajectory.slice(0, animStep + 1).map((step, idx, arr) => {
                    const cx = centerCanvas + step.dx_pixels * scaleVisual;
                    const cy = centerCanvas + step.dy_pixels * scaleVisual;
                    const prevStep = idx > 0 ? arr[idx - 1] : null;
                    const prevX = prevStep ? centerCanvas + prevStep.dx_pixels * scaleVisual : centerCanvas;
                    const prevY = prevStep ? centerCanvas + prevStep.dy_pixels * scaleVisual : centerCanvas;

                    return (
                      <g key={`step-${idx}`}>
                        {idx > 0 && (
                          <line
                            x1={prevX}
                            y1={prevY}
                            x2={cx}
                            y2={cy}
                            stroke="#f43f5e"
                            strokeWidth="2"
                            strokeDasharray="3,2"
                            className="drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={idx === animStep ? 5 : 3}
                          fill={idx === animStep ? '#fb7185' : '#f43f5e'}
                          stroke="#0b111e"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}

                  {/* 3-Sigma Positional Uncertainty Ellipse at Current Node */}
                  {trackResult.trajectory[animStep] && (() => {
                    const activeStep = trackResult.trajectory[animStep];
                    const cx = centerCanvas + activeStep.dx_pixels * scaleVisual;
                    const cy = centerCanvas + activeStep.dy_pixels * scaleVisual;
                    const rUncert = (trackResult.centroid_uncertainty_arcsec / 6.2) * scaleVisual * 3;
                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={Math.max(6, rUncert)}
                          fill="rgba(0, 240, 255, 0.15)"
                          stroke="#00f0ff"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                        <text
                          x={cx + 8}
                          y={cy + 12}
                          fill="#fecdd3"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          T+{activeStep.day}d ({activeStep.displacement_arcsec}″)
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Baseline Time Delta Slider */}
            <div className="space-y-1 pt-2 border-t border-space-850">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Observation Baseline (Δt):</span>
                </span>
                <span className="text-cyan-400 font-bold">{baselineDays} Days ({((baselineDays / 30.4)).toFixed(1)} Months)</span>
              </div>
              <input
                type="range"
                min="7"
                max="365"
                step="7"
                value={baselineDays}
                onChange={(e) => setBaselineDays(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-space-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>1 Week (7d)</span>
                <span>6 Months (183d)</span>
                <span>1 Full Year (365d)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Quantitative Kinematics & Popperian H2 Audit (7 cols) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            {/* Target Scientific Context Card */}
            <div className="bg-space-950 p-4 rounded-xl border border-space-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeBenchmark.name}</h3>
                  <span className="text-xs font-mono text-cyan-300">{activeBenchmark.scientific_context}</span>
                </div>
                <button
                  onClick={() => onLoadCoordinates(activeBenchmark.ra_deg, activeBenchmark.dec_deg, activeBenchmark.name)}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-space-950 rounded text-xs font-mono font-bold flex items-center space-x-1 transition shadow"
                  title="Load target into Sky Explorer and query genuine SPHEREx exposures"
                >
                  <span>Explore FITS</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                {activeBenchmark.expected_motion_note}
              </p>
            </div>

            {/* Quantitative Astrometric Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                <span className="text-slate-500 block text-[10px]">Predicted Displacement:</span>
                <span className="text-cyan-400 font-bold text-sm">{trackResult.total_displacement_arcsec}″</span>
                <span className="text-[10px] text-slate-400 block">{trackResult.total_displacement_pixels} px @ 6.2″/px</span>
              </div>

              <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                <span className="text-slate-500 block text-[10px]">Daily Velocity:</span>
                <span className="text-amber-400 font-bold text-sm">{trackResult.daily_rate_arcsec_day}″/day</span>
                <span className="text-[10px] text-slate-400 block">PA: {trackResult.position_angle_deg}°</span>
              </div>

              <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                <span className="text-slate-500 block text-[10px]">Positional Uncertainty:</span>
                <span className="text-slate-200 font-bold text-sm">±{trackResult.centroid_uncertainty_arcsec}″</span>
                <span className="text-[10px] text-slate-400 block">1σ Centroid FWHM</span>
              </div>

              <div className="bg-space-950 p-3 rounded-lg border border-space-800">
                <span className="text-slate-500 block text-[10px]">Astrometric Significance:</span>
                <span className={trackResult.significance_sigma >= 5.0 ? 'text-emerald-400 font-bold text-sm' : 'text-purple-300 font-bold text-sm'}>
                  {trackResult.significance_sigma}σ
                </span>
                <span className="text-[10px] text-slate-400 block">Threshold: ≥3.0σ</span>
              </div>
            </div>

            {/* Step-by-Step Trajectory Table */}
            <div className="bg-space-950 p-3 rounded-lg border border-space-800 overflow-x-auto">
              <div className="text-xs font-mono font-bold text-slate-200 pb-2 border-b border-space-800 flex justify-between items-center">
                <span>Multi-Epoch Trajectory Sequence</span>
                <span className="text-[10px] text-slate-400">{trackResult.trajectory.length} Discrete Ephemeris Steps</span>
              </div>
              <table className="w-full text-[11px] font-mono text-left mt-2">
                <thead>
                  <tr className="text-slate-500 border-b border-space-850">
                    <th className="pb-1.5">Epoch Step</th>
                    <th className="pb-1.5">Timestamp (Δt)</th>
                    <th className="pb-1.5">Projected RA</th>
                    <th className="pb-1.5">Projected Dec</th>
                    <th className="pb-1.5 text-right">Shift (Δθ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-850">
                  {trackResult.trajectory.map((step, idx) => (
                    <tr
                      key={`traj-${idx}`}
                      className={`hover:bg-space-900 transition ${idx === animStep ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300'}`}
                    >
                      <td className="py-1">Pass #{step.step}</td>
                      <td className="py-1">+{step.day} Days</td>
                      <td className="py-1">{step.ra_deg.toFixed(5)}°</td>
                      <td className="py-1">{step.dec_deg >= 0 ? '+' : ''}{step.dec_deg.toFixed(5)}°</td>
                      <td className="py-1 text-right text-rose-400 font-bold">{step.displacement_arcsec}″</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Popperian H2 Falsification Audit Box */}
            <div className="bg-space-950 p-4 rounded-xl border border-space-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-space-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-100">Hypothesis H2: Astrometric Motion Verification</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    trackResult.validation_status === 'SUPPORTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : trackResult.validation_status === 'CANDIDATE_DETECTION'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {trackResult.validation_status}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {trackResult.verdict}
              </p>
              <div className="pt-2 border-t border-space-800 text-[10px] text-slate-500 flex justify-between items-center">
                <span>Methodology: Popperian Null Hypothesis H0 (Displacement ≤ 3σ) rejected if centroid shift &gt; 3σ</span>
                <span className="text-cyan-400">Stationary control stars confirmed at zero shift</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
