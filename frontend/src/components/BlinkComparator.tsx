import React, { useState, useEffect, useRef } from 'react';
import { ObservationRecord } from '../types';
import { FITSViewer } from './FITSViewer';
import { Zap, Play, Pause, ArrowLeftRight, Clock, Eye, AlertCircle } from 'lucide-react';

interface BlinkComparatorProps {
  observations: ObservationRecord[];
  centerRa: number;
  centerDec: number;
}

export const BlinkComparator: React.FC<BlinkComparatorProps> = ({
  observations,
  centerRa,
  centerDec,
}) => {
  const [indexA, setIndexA] = useState<number>(0);
  const [indexB, setIndexB] = useState<number>(observations.length > 1 ? 1 : 0);
  const [isBlinking, setIsBlinking] = useState<boolean>(true);
  const [currentEpoch, setCurrentEpoch] = useState<'A' | 'B'>('A');
  const [blinkIntervalMs, setBlinkIntervalMs] = useState<number>(500); // 500ms default

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (indexA >= observations.length) setIndexA(0);
    if (indexB >= observations.length) setIndexB(observations.length > 1 ? 1 : 0);
  }, [observations.length, indexA, indexB]);

  useEffect(() => {
    if (isBlinking && observations.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentEpoch((prev) => (prev === 'A' ? 'B' : 'A'));
      }, blinkIntervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBlinking, blinkIntervalMs, observations.length]);

  if (observations.length < 2) {
    return (
      <div className="bg-space-900 border border-space-800 rounded-xl p-8 text-center">
        <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">Insufficient Epochs for Blink Comparator</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          The Blink Comparator requires at least two distinct observation epochs to alternate between.
          Please select a target with multi-epoch coverage like Barnard's Star (50 observations) or NEP Benchmark.
        </p>
      </div>
    );
  }

  const obsA = observations[indexA] || observations[0];
  const obsB = observations[indexB] || observations[1];
  const activeObs = currentEpoch === 'A' ? obsA : obsB;
  const deltaDays = Math.abs(obsB.mjd - obsA.mjd);

  const toggleManual = () => {
    setIsBlinking(false);
    setCurrentEpoch((prev) => (prev === 'A' ? 'B' : 'A'));
  };

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            Astronomical Blink Comparator
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Tombaugh Discovery Mode
          </span>
        </div>

        {/* Active Blink Status Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Displaying:</span>
          <span
            className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider transition-colors duration-100 ${
              currentEpoch === 'A'
                ? 'bg-cyan-500 text-space-950 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'bg-amber-400 text-space-950 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
            }`}
          >
            EPOCH {currentEpoch} ({currentEpoch === 'A' ? obsA.obs_id.slice(0, 18) : obsB.obs_id.slice(0, 18)})
          </span>
        </div>
      </div>

      {/* Epoch Selection Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-space-950 p-4 rounded-lg border border-space-800">
        <div>
          <label className="flex items-center justify-between text-xs font-mono text-cyan-300 mb-1">
            <span>EPOCH A (Reference Exposure)</span>
            <span className="text-[10px] text-slate-400">MJD {obsA.mjd.toFixed(3)}</span>
          </label>
          <select
            value={indexA}
            onChange={(e) => setIndexA(parseInt(e.target.value))}
            className="w-full bg-space-900 border border-space-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {observations.map((obs, idx) => (
              <option key={`a-${obs.obs_id}-${idx}`} value={idx}>
                #{idx + 1} | {obs.obs_date.slice(0, 10)} | MJD {obs.mjd.toFixed(2)} | {obs.band}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center justify-between text-xs font-mono text-amber-300 mb-1">
            <span>EPOCH B (Target Exposure)</span>
            <span className="text-[10px] text-slate-400">MJD {obsB.mjd.toFixed(3)}</span>
          </label>
          <select
            value={indexB}
            onChange={(e) => setIndexB(parseInt(e.target.value))}
            className="w-full bg-space-900 border border-space-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
          >
            {observations.map((obs, idx) => (
              <option key={`b-${obs.obs_id}-${idx}`} value={idx}>
                #{idx + 1} | {obs.obs_date.slice(0, 10)} | MJD {obs.mjd.toFixed(2)} | {obs.band}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Viewport for Active Blink Frame */}
      <FITSViewer
        title={`Blink View: Epoch ${currentEpoch}`}
        imageUrl={activeObs.preview_url}
        obsId={activeObs.obs_id}
        centerRa={centerRa}
        centerDec={centerDec}
        detector={activeObs.detector}
        mjd={activeObs.mjd}
      />

      {/* Blink Rate & Playback Controls */}
      <div className="p-4 bg-space-950/80 border border-space-800 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsBlinking(!isBlinking)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-mono text-xs font-semibold tracking-wider transition ${
              isBlinking
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                : 'bg-space-800 hover:bg-space-700 text-slate-200 border border-space-700'
            }`}
          >
            {isBlinking ? (
              <>
                <Pause className="w-4 h-4" />
                <span>PAUSE BLINK</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>START AUTO-BLINK</span>
              </>
            )}
          </button>

          <button
            onClick={toggleManual}
            className="flex items-center space-x-1.5 px-3 py-2 bg-space-800 hover:bg-space-700 text-slate-300 border border-space-700 rounded-md text-xs font-mono transition"
            title="Switch Between A and B Manually"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Toggle A / B</span>
          </button>
        </div>

        {/* Blink Speed Selector */}
        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <span>Blink Cadence:</span>
          <div className="flex items-center space-x-1">
            {[200, 350, 500, 1000].map((ms) => (
              <button
                key={ms}
                onClick={() => setBlinkIntervalMs(ms)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                  blinkIntervalMs === ms
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-space-900 text-slate-400 hover:text-slate-200 border border-space-800'
                }`}
              >
                {ms} ms
              </button>
            ))}
          </div>
        </div>

        {/* Temporal Baseline Indicator */}
        <div className="text-xs font-mono text-slate-300 flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Temporal Baseline: <strong className="text-cyan-300">Δt = {deltaDays.toFixed(2)} days</strong></span>
        </div>
      </div>
    </div>
  );
};
