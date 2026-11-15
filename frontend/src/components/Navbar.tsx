import React from 'react';
import { Telescope, Compass, History, Layers, Activity, ShieldCheck, Info, Sparkles, Orbit, Target, Globe } from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: SystemHealth | null;
  onOpenMissionModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  onOpenMissionModal,
}) => {
  const tabs = [
    { id: 'explore', label: 'Sky Explorer', icon: Compass },
    { id: 'timemachine', label: 'Time Machine & Blink', icon: History },
    { id: 'movers', label: 'Astrometric Motion Lab', icon: Target },
    { id: 'difference', label: 'Image Subtraction', icon: Layers },
    { id: 'spectral', label: '102 Spectral Bands', icon: Activity },
    { id: 'lightcurve', label: 'Photometry & Variability', icon: Orbit },
    { id: 'skymap', label: '3D Celestial Map', icon: Globe },
    { id: 'popperian', label: 'Falsification Matrix', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-space-900/90 backdrop-blur-md border-b border-space-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Mission Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('explore')}>
            <div className="relative p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30">
              <Telescope className="w-6 h-6 text-cyan-400 animate-pulse-subtle" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-wider text-white">SPHEREx</span>
                <span className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
                  TimeLens
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">Team CodeGenesis • NASA Space Apps 2026</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions & Live Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded bg-space-950/80 border border-space-800 text-[11px] font-mono">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  health?.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  health?.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </span>
              <span className="text-slate-400">IRSA TAP:</span>
              <span className={health?.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}>
                {health?.archive_status || 'CONNECTING'}
              </span>
            </div>

            <button
              onClick={onOpenMissionModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-space-800 hover:bg-space-700 border border-space-700 rounded-md transition"
              title="SPHEREx Instrument Specifications & Scientific Principles"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Mission Specs</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center space-x-1 py-2 overflow-x-auto no-scrollbar border-t border-space-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
