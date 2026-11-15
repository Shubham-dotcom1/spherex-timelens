import React, { useState, useEffect } from 'react';
import {
  TargetPreset,
  ObservationRecord,
  SystemHealth,
} from './types';
import {
  fetchHealth,
  fetchTargets,
  searchObservations,
} from './services/api';
import { Navbar } from './components/Navbar';
import { TargetPresetSelector } from './components/TargetPresetSelector';
import { CoordinateSearchBar } from './components/CoordinateSearchBar';
import { FITSViewer } from './components/FITSViewer';
import { TimeMachineViewer } from './components/TimeMachineViewer';
import { BlinkComparator } from './components/BlinkComparator';
import { DifferenceViewer } from './components/DifferenceViewer';
import { SpectralViewer } from './components/SpectralViewer';
import { LightCurveViewer } from './components/LightCurveViewer';
import { PopperianMatrix } from './components/PopperianMatrix';
import { MovingObjectsLab } from './components/MovingObjectsLab';
import { CelestialSkyMap } from './components/CelestialSkyMap';
import { MissionModal } from './components/MissionModal';

import {
  Compass,
  History,
  Layers,
  Activity,
  Orbit,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  Share2,
  Check
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [targets, setTargets] = useState<TargetPreset[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TargetPreset | null>(null);

  const [activeRa, setActiveRa] = useState<number>(270.3317);
  const [activeDec, setActiveDec] = useState<number>(66.5614);
  const [targetName, setTargetName] = useState<string>('NEP Deep Survey Benchmark');

  const [observations, setObservations] = useState<ObservationRecord[]>([]);
  const [selectedObs, setSelectedObs] = useState<ObservationRecord | null>(null);
  const [isLoadingObs, setIsLoadingObs] = useState<boolean>(false);
  const [obsError, setObsError] = useState<string | null>(null);

  const [isMissionModalOpen, setIsMissionModalOpen] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Initialize application, targets, health check & parse URL parameters
  useEffect(() => {
    async function init() {
      try {
        const [h, t] = await Promise.all([fetchHealth(), fetchTargets()]);
        setHealth(h);
        setTargets(t);

        // Parse URL search params if present
        const urlParams = new URLSearchParams(window.location.search);
        const urlRa = urlParams.get('ra');
        const urlDec = urlParams.get('dec');
        const urlTarget = urlParams.get('target');
        const urlTab = urlParams.get('tab');

        if (urlTab) setActiveTab(urlTab);

        if (urlRa && urlDec) {
          const parsedRa = parseFloat(urlRa);
          const parsedDec = parseFloat(urlDec);
          setActiveRa(parsedRa);
          setActiveDec(parsedDec);
          setTargetName(urlTarget || `Field (${parsedRa.toFixed(2)}°, ${parsedDec.toFixed(2)}°)`);
          loadObs({ ra: parsedRa, dec: parsedDec, radius_deg: 0.5 });
        } else if (t.length > 0) {
          // Default to first target (Barnard's Star or NEP)
          const defaultTarget = t.find((item) => item.id === 'benchmark-nep') || t[0];
          const ra = defaultTarget.ra ?? defaultTarget.ra_deg ?? 270.3317;
          const dec = defaultTarget.dec ?? defaultTarget.dec_deg ?? 66.5614;
          setSelectedTarget(defaultTarget);
          setActiveRa(ra);
          setActiveDec(dec);
          setTargetName(defaultTarget.name);
          loadObs({ ra, dec, radius_deg: 0.5 });
        } else {
          loadObs({ ra: 270.3317, dec: 66.5614, radius_deg: 0.5 });
        }
      } catch (err) {
        console.error('Initialization error:', err);
        // Fallback to NEP coordinates if initial fetch fails
        loadObs({ ra: 270.3317, dec: 66.5614, radius_deg: 0.5 });
      }
    }
    init();
  }, []);

  const loadObs = async (params: { ra?: number; dec?: number; coords?: string; radius_deg: number; band?: string }) => {
    setIsLoadingObs(true);
    setObsError(null);
    try {
      const queryRa = params.coords ? undefined : (params.ra !== undefined ? params.ra : activeRa);
      const queryDec = params.coords ? undefined : (params.dec !== undefined ? params.dec : activeDec);
      const records = await searchObservations({
        ...params,
        ra: queryRa,
        dec: queryDec,
      });
      setObservations(records);
      if (records.length > 0) {
        setSelectedObs(records[0]);
      } else {
        setSelectedObs(null);
      }
    } catch (err: any) {
      setObsError(err.message || 'Error querying IRSA TAP observations');
      setObservations([]);
      setSelectedObs(null);
    } finally {
      setIsLoadingObs(false);
    }
  };

  const handleSelectPreset = (target: TargetPreset) => {
    const ra = target.ra ?? target.ra_deg ?? 270.3317;
    const dec = target.dec ?? target.dec_deg ?? 66.5614;
    setSelectedTarget(target);
    setActiveRa(ra);
    setActiveDec(dec);
    setTargetName(target.name);
    loadObs({ ra, dec, radius_deg: 0.5 });
    // Update URL query parameters seamlessly
    const url = new URL(window.location.href);
    url.searchParams.set('target', target.id);
    url.searchParams.set('ra', ra.toString());
    url.searchParams.set('dec', dec.toString());
    window.history.replaceState({}, '', url.toString());
  };

  const handleShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('ra', activeRa.toFixed(4));
    url.searchParams.set('dec', activeDec.toFixed(4));
    url.searchParams.set('target', targetName);
    url.searchParams.set('tab', activeTab);
    navigator.clipboard.writeText(url.toString());
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col">
      {/* Top Observatory Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onOpenMissionModal={() => setIsMissionModalOpen(true)}
      />

      {/* Main Observatory Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner with Target Summary & Share Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-space-900 border border-space-800 rounded-xl shadow-md gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {targetName}
                </h1>
                {selectedTarget?.status === 'VERIFIED' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    DR1 Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedTarget?.status || 'Active Coordinates'}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400">
                RA {activeRa.toFixed(4)}° ({((activeRa / 15)).toFixed(2)}h) • Dec {activeDec >= 0 ? '+' : ''}{activeDec.toFixed(4)}° • {observations.length} SPHEREx Exposures
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-space-800 hover:bg-space-700 text-slate-300 border border-space-700 rounded-md text-xs font-mono transition"
              title="Copy Shareable URL with coordinates & active tab"
            >
              {copiedShareLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share Search</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Sky Explorer & Target Presets */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            <TargetPresetSelector
              targets={targets}
              selectedTargetId={selectedTarget?.id || null}
              onSelectTarget={handleSelectPreset}
              isLoading={isLoadingObs}
            />

            <CoordinateSearchBar
              onSearch={(params) => {
                if (params.ra !== undefined) setActiveRa(params.ra);
                if (params.dec !== undefined) setActiveDec(params.dec);
                setTargetName(`User Target (${params.ra?.toFixed(2) || 'HMS'}, ${params.dec?.toFixed(2) || 'DMS'})`);
                setSelectedTarget(null);
                loadObs(params);
              }}
              isLoading={isLoadingObs}
              initialRa={activeRa}
              initialDec={activeDec}
            />

            {/* Observations Table & Active FITS Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Exposure Catalog */}
              <div className="lg:col-span-1 bg-space-900 border border-space-800 rounded-xl p-4 shadow-lg flex flex-col h-[680px] lg:h-[740px]">
                <div className="flex items-center justify-between pb-3 border-b border-space-800">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold font-mono uppercase text-slate-200">
                      Observation Epochs ({observations.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">IRSA TAP DR1</span>
                </div>

                {obsError && (
                  <div className="my-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300">
                    {obsError}
                  </div>
                )}

                <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
                  {observations.map((obs, idx) => {
                    const isSelected = selectedObs?.obs_id === obs.obs_id;
                    return (
                      <div
                        key={`${obs.obs_id}-${idx}`}
                        onClick={() => setSelectedObs(obs)}
                        className={`p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition ${
                          isSelected
                            ? 'bg-space-800 border-cyan-400/80 ring-1 ring-cyan-400/40 text-white'
                            : 'bg-space-950/70 border-space-800 hover:border-space-700 hover:bg-space-850 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-cyan-400 font-semibold">#{idx + 1} {obs.band}</span>
                          <span className="text-[10px] text-slate-400">MJD {obs.mjd.toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {obs.obs_id}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                          <span>{obs.obs_date.slice(0, 10)}</span>
                          <span>{obs.wavelength_min_um}–{obs.wavelength_max_um} µm</span>
                        </div>
                      </div>
                    );
                  })}

                  {observations.length === 0 && !isLoadingObs && (
                    <div className="py-12 text-center text-xs text-slate-500 font-mono">
                      No exposures found in this field.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: High-Res FITS Viewport */}
              <div className="lg:col-span-2">
                {selectedObs ? (
                  <FITSViewer
                    title={`FITS Visualizer: ${selectedObs.band}`}
                    imageUrl={selectedObs.preview_url}
                    obsId={selectedObs.obs_id}
                    centerRa={activeRa}
                    centerDec={activeDec}
                    detector={selectedObs.detector}
                    mjd={selectedObs.mjd}
                  />
                ) : (
                  <div className="bg-space-900 border border-space-800 rounded-xl p-16 text-center text-slate-400 font-mono text-xs">
                    Select an observation epoch on the left to preview scientific FITS data.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Time Machine & Blink Comparator */}
        {activeTab === 'timemachine' && (
          <div className="space-y-6">
            <TimeMachineViewer
              observations={observations}
              centerRa={activeRa}
              centerDec={activeDec}
              onOpenBlinkMode={() => {
                const el = document.getElementById('blink-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <div id="blink-section">
              <BlinkComparator
                observations={observations}
                centerRa={activeRa}
                centerDec={activeDec}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Astrometric Motion Lab & Trail Tracking */}
        {activeTab === 'movers' && (
          <MovingObjectsLab
            onLoadCoordinates={(ra, dec, name) => {
              setActiveRa(ra);
              setActiveDec(dec);
              setTargetName(name);
              setActiveTab('explore');
              loadObs({ ra, dec, radius_deg: 0.5 });
            }}
          />
        )}

        {/* Tab 4: Epoch Comparison & Image Subtraction */}
        {activeTab === 'difference' && (
          <DifferenceViewer
            observations={observations}
            centerRa={activeRa}
            centerDec={activeDec}
          />
        )}

        {/* Tab 5: 102 Spectral Bands & SED */}
        {activeTab === 'spectral' && (
          <SpectralViewer
            ra={activeRa}
            dec={activeDec}
            targetName={targetName}
          />
        )}

        {/* Tab 6: Photometry & Light Curve */}
        {activeTab === 'lightcurve' && (
          <LightCurveViewer
            ra={activeRa}
            dec={activeDec}
            targetName={targetName}
          />
        )}

        {/* Tab 7: 3D Celestial Sky Map & All-Sky Coverage */}
        {activeTab === 'skymap' && (
          <CelestialSkyMap
            targets={targets}
            activeRa={activeRa}
            activeDec={activeDec}
            onSelectTarget={(target) => {
              handleSelectPreset(target);
              setActiveTab('explore');
            }}
            onSelectCoordinates={(ra, dec, label) => {
              setActiveRa(ra);
              setActiveDec(dec);
              setTargetName(label);
              setSelectedTarget(null);
              setActiveTab('explore');
              loadObs({ ra, dec, radius_deg: 0.5 });
            }}
          />
        )}

        {/* Tab 8: Popperian Falsification Matrix */}
        {activeTab === 'popperian' && (
          <PopperianMatrix
            ra={activeRa}
            dec={activeDec}
            targetName={targetName}
            observationsCount={observations.length}
          />
        )}
      </main>

      {/* Mission Reference Modal */}
      <MissionModal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
      />

      {/* Observatory Footer */}
      <footer className="mt-auto border-t border-space-800 bg-space-900/60 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SPHEREx TimeLens</strong> • Team CodeGenesis • NASA Space Apps Challenge 2026
          </div>
          <div className="text-slate-400">
            Data provided by NASA/IPAC Infrared Science Archive (Caltech/JPL)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
