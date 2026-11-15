import React from 'react';
import { TargetPreset } from '../types';
import { Crosshair, Star, CheckCircle, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface TargetPresetSelectorProps {
  targets: TargetPreset[];
  selectedTargetId: string | null;
  onSelectTarget: (target: TargetPreset) => void;
  isLoading: boolean;
}

export const TargetPresetSelector: React.FC<TargetPresetSelectorProps> = ({
  targets,
  selectedTargetId,
  onSelectTarget,
  isLoading,
}) => {
  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-space-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Crosshair className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white tracking-wide">
              Mandatory Astronomical Targets & Benchmarks
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Presets designated by NASA Space Apps Challenge 2026. Evaluated under Popperian falsification criteria.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="flex items-center space-x-1 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Verified in DR1 ({targets.filter(t => t.status === 'VERIFIED').length})</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>DR1 Coverage Gap ({targets.filter(t => t.status !== 'VERIFIED').length})</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {targets.map((target) => {
          const isSelected = selectedTargetId === target.id;
          const isVerified = target.status === 'VERIFIED';

          return (
            <div
              key={target.id}
              onClick={() => onSelectTarget(target)}
              className={`group relative p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-space-800/90 border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/50'
                  : 'bg-space-950/70 border-space-800 hover:border-space-700 hover:bg-space-850'
              }`}
            >
              <div>
                {/* Header: Name and Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded ${
                      target.category === 'benchmark' ? 'bg-cyan-500/20 text-cyan-300' :
                      target.category === 'astrometry' ? 'bg-sky-500/20 text-sky-300' :
                      target.category === 'brown-dwarf' ? 'bg-amber-500/20 text-amber-300' :
                      target.category === 'planet-x' ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/50' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition">
                        {target.name}
                      </h3>
                      <span className="text-[10px] font-mono uppercase text-slate-400">
                        {target.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      isVerified
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>{target.observation_count} Obs</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3 h-3" />
                        <span>No DR1 Cov</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Coordinates & Motion */}
                <div className="mt-3 p-2 bg-space-900/80 rounded border border-space-800/80 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">RA / Dec:</span>
                    <span>{target.ra_sexagesimal || `${(target.ra ?? target.ra_deg ?? 0).toFixed(4)}°`}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Deg (J2000):</span>
                    <span>{(target.ra ?? target.ra_deg ?? 0).toFixed(4)}°, {(target.dec ?? target.dec_deg ?? 0).toFixed(4)}°</span>
                  </div>
                  {((target.pm_ra_mas_yr ?? 0) !== 0 || (target.pm_dec_mas_yr ?? 0) !== 0) && (
                    <div className="flex justify-between text-cyan-300/80">
                      <span className="text-slate-500">Proper Motion:</span>
                      <span>
                        μ: [{target.pm_ra_mas_yr ?? 0}, {target.pm_dec_mas_yr ?? 0}] mas/yr
                      </span>
                    </div>
                  )}
                </div>

                {/* Scientific Context */}
                <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                  {target.scientific_context}
                </p>
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-3 border-t border-space-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-cyan-400/90 group-hover:text-cyan-300 flex items-center space-x-1">
                  <span>{isSelected ? 'Currently Loaded' : 'Load Target Data'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 transform transition ${isSelected ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
                </span>
                {isVerified && (
                  <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                    NASA Verified
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
