import React, { useState, useEffect, useRef } from 'react';
import { ObservationRecord, StackResult } from '../types';
import { runCoaddStack } from '../services/api';
import { FITSViewer } from './FITSViewer';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

interface TimeMachineViewerProps {
  observations: ObservationRecord[];
  centerRa: number;
  centerDec: number;
  onOpenBlinkMode?: () => void;
}

export const TimeMachineViewer: React.FC<TimeMachineViewerProps> = ({
  observations,
  centerRa,
  centerDec,
  onOpenBlinkMode,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(2); // Frames per second
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Standout Feature: Multi-Epoch Co-Addition Stack Mode
  const [viewMode, setViewMode] = useState<'timelapse' | 'stack'>('timelapse');
  const [stackMethod, setStackMethod] = useState<'median' | 'mean'>('median');
  const [stackResult, setStackResult] = useState<StackResult | null>(null);
  const [isStacking, setIsStacking] = useState<boolean>(false);

  const sortedObs = [...observations].sort((a, b) => a.mjd - b.mjd);
  const activeObs = sortedObs[currentIndex] || sortedObs[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleComputeStack = async () => {
    setIsStacking(true);
    try {
      const res = await runCoaddStack({
        obs_ids: sortedObs.map((o) => o.obs_id),
        ra: centerRa,
        dec: centerDec,
        method: stackMethod,
      });
      setStackResult(res);
      setViewMode('stack');
    } catch (err: any) {
      console.error('Stack error:', err);
    } finally {
      setIsStacking(false);
    }
  };

  useEffect(() => {
    if (currentIndex >= sortedObs.length) {
      setCurrentIndex(0);
    }
  }, [sortedObs.length, currentIndex]);

  useEffect(() => {
    if (isPlaying && sortedObs.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= sortedObs.length - 1) {
            return isLooping ? 0 : prev;
          }
          return prev + 1;
        });
      }, 1000 / fps);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, fps, sortedObs.length, isLooping]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < sortedObs.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : sortedObs.length - 1));
  };

  if (sortedObs.length === 0) {
    return (
      <div className="bg-space-900 border border-space-800 rounded-xl p-8 text-center">
        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">No Multi-Epoch Observations Loaded</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Please select a preset target (e.g. Barnard's Star or NEP Benchmark) or search coordinates with observations in DR1 to run the Time Machine.
        </p>
      </div>
    );
  }

  const initialMjd = sortedObs[0].mjd;
  const currentDeltaDays = activeObs ? (activeObs.mjd - initialMjd) : 0;

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Time Machine Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            Infrared Multi-Epoch Time Machine
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            {sortedObs.length} Epochs Available
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle: Timelapse vs Stack */}
          <div className="flex items-center p-0.5 bg-space-950 rounded border border-space-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('timelapse')}
              className={`px-3 py-1 rounded transition ${
                viewMode === 'timelapse'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Time-Lapse Mode
            </button>
            <button
              onClick={() => {
                if (!stackResult) handleComputeStack();
                else setViewMode('stack');
              }}
              className={`px-3 py-1 rounded transition flex items-center space-x-1 ${
                viewMode === 'stack'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Co-Add Stack Mode</span>
            </button>
          </div>

          {onOpenBlinkMode && (
            <button
              onClick={onOpenBlinkMode}
              className="flex items-center space-x-1.5 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-md text-xs font-mono transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Blink</span>
            </button>
          )}
        </div>
      </div>

      {/* Main FITS Viewport */}
      {viewMode === 'stack' ? (
        <div className="space-y-4">
          <FITSViewer
            title={`Multi-Epoch Co-Add Stack (${stackResult?.n_epochs_coadded || sortedObs.length} Epochs, ${stackResult?.method || stackMethod} Co-Addition)`}
            imageUrl={stackResult?.stacked_preview_url || activeObs.preview_url}
            obsId={`STACK_${sortedObs.length}_EPOCHS`}
            centerRa={centerRa}
            centerDec={centerDec}
            detector={activeObs.detector}
          />

          {/* Stacking Quantitative Metrics Card */}
          {stackResult && (
            <div className="bg-space-950 p-4 rounded-xl border border-purple-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-space-850">
                <div className="flex items-center space-x-2 text-purple-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Co-Addition SNR Enhancement Manifest</span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={stackMethod}
                    onChange={(e: any) => {
                      setStackMethod(e.target.value);
                      handleComputeStack();
                    }}
                    className="bg-space-900 border border-space-800 rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none"
                  >
                    <option value="median">Median Stacking (Rejects Outliers/Movers)</option>
                    <option value="mean">Mean Stacking (Linear Variance Propagation)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Co-Added Exposures:</span>
                  <span className="text-cyan-400 font-bold">{stackResult.n_epochs_coadded} Epochs</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Theoretical SNR Boost:</span>
                  <span className="text-emerald-400 font-bold text-sm">+{stackResult.snr_gain_factor}x (√N)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Noise Suppression:</span>
                  <span className="text-purple-300 font-bold text-sm">-{stackResult.noise_reduction_pct}% RMS</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Stack Residual Noise:</span>
                  <span className="text-slate-200">{stackResult.stacked_rms_mjy_sr} MJy/sr</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-2 border-t border-space-850">
                {stackResult.notes}
              </p>
            </div>
          )}
        </div>
      ) : activeObs && (
        <FITSViewer
          title={`Observation Epoch ${currentIndex + 1} of ${sortedObs.length}`}
          imageUrl={activeObs.preview_url}
          obsId={activeObs.obs_id}
          centerRa={centerRa}
          centerDec={centerDec}
          detector={activeObs.detector}
          mjd={activeObs.mjd}
        />
      )}

      {/* Epoch HUD Status Banner */}
      {activeObs && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-space-950 p-3 rounded-lg border border-space-800 font-mono text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">Observation Epoch:</span>
            <span className="text-slate-200 font-semibold">{activeObs.obs_date.slice(0, 19).replace('T', ' ')} UTC</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Modified Julian Date:</span>
            <span className="text-cyan-400">MJD {activeObs.mjd.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Baseline Time Delta:</span>
            <span className="text-amber-400">Δt: +{currentDeltaDays.toFixed(2)} days</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Band / Wavelength:</span>
            <span className="text-purple-300">
              {activeObs.band} ({activeObs.wavelength_min_um}–{activeObs.wavelength_max_um} µm)
            </span>
          </div>
        </div>
      )}

      {/* Interactive Time-Lapse Player Controls */}
      <div className="p-4 bg-space-950/70 border border-space-800/80 rounded-lg space-y-3">
        {/* Timeline Scrubber */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Epoch 1 (MJD {sortedObs[0].mjd.toFixed(2)})</span>
            <span className="text-cyan-300">
              Current: Frame {currentIndex + 1} / {sortedObs.length}
            </span>
            <span>Epoch {sortedObs.length} (MJD {sortedObs[sortedObs.length - 1].mjd.toFixed(2)})</span>
          </div>
          <input
            type="range"
            min="0"
            max={sortedObs.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setCurrentIndex(parseInt(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full accent-cyan-400 h-2 bg-space-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Buttons and Speed Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              className="p-2 bg-space-900 hover:bg-space-800 text-slate-300 border border-space-800 rounded-md transition"
              title="Previous Observation Epoch"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-mono text-xs font-semibold tracking-wider transition ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-space-950 shadow-md'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-space-950 shadow-md'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>PLAY TIMELAPSE</span>
                </>
              )}
            </button>
            <button
              onClick={handleNext}
              className="p-2 bg-space-900 hover:bg-space-800 text-slate-300 border border-space-800 rounded-md transition"
              title="Next Observation Epoch"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed & Loop Controls */}
          <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <span>Speed:</span>
              <select
                value={fps}
                onChange={(e) => setFps(parseFloat(e.target.value))}
                className="bg-space-900 border border-space-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="0.5">0.5 FPS (Slow)</option>
                <option value="1">1.0 FPS</option>
                <option value="2">2.0 FPS</option>
                <option value="4">4.0 FPS</option>
                <option value="8">8.0 FPS (Fast)</option>
              </select>
            </div>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="accent-cyan-400 rounded"
              />
              <span className="text-slate-300">Loop</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
