import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sliders, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

interface CoordinateSearchBarProps {
  onSearch: (params: { coords?: string; ra?: number; dec?: number; radius_deg: number; band?: string }) => void;
  isLoading: boolean;
  initialRa?: number;
  initialDec?: number;
}

export const CoordinateSearchBar: React.FC<CoordinateSearchBarProps> = ({
  onSearch,
  isLoading,
  initialRa,
  initialDec,
}) => {
  const [searchMode, setSearchMode] = useState<'decimal' | 'sexagesimal'>('decimal');
  const [ra, setRa] = useState<string>(initialRa !== undefined ? initialRa.toFixed(5) : '270.3317');
  const [dec, setDec] = useState<string>(initialDec !== undefined ? initialDec.toFixed(5) : '66.5614');
  const [coordString, setCoordString] = useState<string>('17h57m48.5s +04d41m36s');
  const [radiusDeg, setRadiusDeg] = useState<number>(0.5);
  const [band, setBand] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRa !== undefined) setRa(initialRa.toFixed(5));
    if (initialDec !== undefined) setDec(initialDec.toFixed(5));
  }, [initialRa, initialDec]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (searchMode === 'decimal') {
      const parsedRa = parseFloat(ra);
      const parsedDec = parseFloat(dec);

      if (isNaN(parsedRa) || parsedRa < 0 || parsedRa > 360) {
        setError('RA must be a decimal number between 0° and 360°.');
        return;
      }
      if (isNaN(parsedDec) || parsedDec < -90 || parsedDec > 90) {
        setError('Dec must be a decimal number between -90° and +90°.');
        return;
      }

      onSearch({
        ra: parsedRa,
        dec: parsedDec,
        radius_deg: radiusDeg,
        band: band || undefined,
      });
    } else {
      if (!coordString.trim()) {
        setError('Please enter a sexagesimal coordinate string (e.g., 17h57m48.5s +04d41m36s).');
        return;
      }

      onSearch({
        coords: coordString.trim(),
        radius_deg: radiusDeg,
        band: band || undefined,
      });
    }
  };

  const setPresetCoordinates = (presetRa: number, presetDec: number, name: string) => {
    setSearchMode('decimal');
    setRa(presetRa.toFixed(5));
    setDec(presetDec.toFixed(5));
    setError(null);
    onSearch({
      ra: presetRa,
      dec: presetDec,
      radius_deg: radiusDeg,
      band: band || undefined,
    });
  };

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            Celestial Coordinates & IRSA Query
          </h2>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex items-center space-x-1 p-1 bg-space-950 rounded-lg border border-space-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setSearchMode('decimal')}
            className={`px-2.5 py-1 rounded transition ${
              searchMode === 'decimal'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Decimal Degrees
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('sexagesimal')}
            className={`px-2.5 py-1 rounded transition ${
              searchMode === 'sexagesimal'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sexagesimal (HMS/DMS)
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-4 space-y-4">
        {/* Input Fields */}
        {searchMode === 'decimal' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Right Ascension (RA) [0° – 360°]
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.00001"
                  min="0"
                  max="360"
                  value={ra}
                  onChange={(e) => setRa(e.target.value)}
                  placeholder="270.3317"
                  className="w-full bg-space-950 border border-space-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  required
                />
                <span className="absolute right-3 top-2 text-[10px] font-mono text-slate-500">deg</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Declination (Dec) [-90° – +90°]
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.00001"
                  min="-90"
                  max="90"
                  value={dec}
                  onChange={(e) => setDec(e.target.value)}
                  placeholder="66.5614"
                  className="w-full bg-space-950 border border-space-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  required
                />
                <span className="absolute right-3 top-2 text-[10px] font-mono text-slate-500">deg</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Search Radius (Degrees)
              </label>
              <select
                value={radiusDeg}
                onChange={(e) => setRadiusDeg(parseFloat(e.target.value))}
                className="w-full bg-space-950 border border-space-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="0.1">0.10° (~6 arcmin)</option>
                <option value="0.25">0.25° (~15 arcmin)</option>
                <option value="0.5">0.50° (~30 arcmin)</option>
                <option value="1.0">1.00° (~1.0 deg)</option>
                <option value="2.5">2.50° (Full Detector)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                SPHEREx Detector Band
              </label>
              <select
                value={band}
                onChange={(e) => setBand(e.target.value)}
                className="w-full bg-space-950 border border-space-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Bands (D1 – D6)</option>
                <option value="SPHEREx-D1">Band 1 (0.75 – 1.10 µm)</option>
                <option value="SPHEREx-D2">Band 2 (1.10 – 1.62 µm)</option>
                <option value="SPHEREx-D3">Band 3 (1.63 – 2.41 µm)</option>
                <option value="SPHEREx-D4">Band 4 (2.42 – 3.82 µm)</option>
                <option value="SPHEREx-D5">Band 5 (3.83 – 4.41 µm)</option>
                <option value="SPHEREx-D6">Band 6 (4.42 – 5.00 µm)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Sexagesimal Coordinate String (HMS / DMS)
              </label>
              <input
                type="text"
                value={coordString}
                onChange={(e) => setCoordString(e.target.value)}
                placeholder="17h57m48.5s +04d41m36s or 17:57:48.5 +04:41:36"
                className="w-full bg-space-950 border border-space-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Search Radius
              </label>
              <select
                value={radiusDeg}
                onChange={(e) => setRadiusDeg(parseFloat(e.target.value))}
                className="w-full bg-space-950 border border-space-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="0.25">0.25° (~15 arcmin)</option>
                <option value="0.5">0.50° (~30 arcmin)</option>
                <option value="1.0">1.00°</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-md text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Footer: Submit & Quick Shortcuts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">Quick Benchmarks:</span>
            <button
              type="button"
              onClick={() => setPresetCoordinates(270.3317, 66.5614, 'NEP')}
              className="px-2 py-1 bg-space-950 hover:bg-space-800 text-slate-300 border border-space-800 rounded text-[11px] transition"
            >
              NEP Deep Field
            </button>
            <button
              type="button"
              onClick={() => setPresetCoordinates(269.452075, 4.693364, 'Barnards')}
              className="px-2 py-1 bg-space-950 hover:bg-space-800 text-slate-300 border border-space-800 rounded text-[11px] transition"
            >
              Barnard's Star
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-5 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-space-950 font-semibold text-xs font-mono tracking-wider uppercase transition shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-space-950" />
                <span>Querying IRSA TAP...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-space-950" />
                <span>Execute IRSA Query</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
