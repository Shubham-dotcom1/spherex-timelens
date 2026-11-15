import React, { useState } from 'react';
import { TargetPreset } from '../types';
import {
  Globe,
  Compass,
  Layers,
  MapPin,
  Sparkles,
  ArrowRight,
  Eye,
  Info,
  Maximize2
} from 'lucide-react';

interface CelestialSkyMapProps {
  targets: TargetPreset[];
  activeRa: number;
  activeDec: number;
  onSelectTarget: (target: TargetPreset) => void;
  onSelectCoordinates: (ra: number, dec: number, label: string) => void;
}

export const CelestialSkyMap: React.FC<CelestialSkyMapProps> = ({
  targets,
  activeRa,
  activeDec,
  onSelectTarget,
  onSelectCoordinates,
}) => {
  const [hoveredTarget, setHoveredTarget] = useState<TargetPreset | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ ra: number; dec: number; l: number; b: number } | null>(null);
  const [showGalacticPlane, setShowGalacticPlane] = useState<boolean>(true);
  const [showEclipticPlane, setShowEclipticPlane] = useState<boolean>(true);
  const [showCVZ, setShowCVZ] = useState<boolean>(true);
  const [selectedBand, setSelectedBand] = useState<string>('all');

  // SVG Projection Dimensions
  const mapWidth = 860;
  const mapHeight = 440;
  const pad = { top: 30, right: 40, bottom: 40, left: 50 };

  // Coordinate conversion helpers: RA (0..360) -> X, Dec (-90..90) -> Y
  const toX = (ra: number) => {
    // Standard astronomical orientation: RA 360 on left, 0 on right
    const norm = (360.0 - (ra % 360.0)) / 360.0;
    return pad.left + norm * (mapWidth - pad.left - pad.right);
  };

  const toY = (dec: number) => {
    const norm = (90.0 - dec) / 180.0;
    return pad.top + norm * (mapHeight - pad.top - pad.bottom);
  };

  const fromPixelToCoords = (x: number, y: number) => {
    const normX = (x - pad.left) / (mapWidth - pad.left - pad.right);
    const normY = (y - pad.top) / (mapHeight - pad.top - pad.bottom);
    const ra = ((360.0 - normX * 360.0) % 360.0 + 360.0) % 360.0;
    const dec = 90.0 - normY * 180.0;

    // Approximate Galactic coordinate conversion
    const rad = Math.PI / 180.0;
    const a = ra * rad;
    const d = dec * rad;
    const aPole = 192.85948 * rad;
    const dPole = 27.12825 * rad;
    const sinB = Math.sin(d) * Math.sin(dPole) + Math.cos(d) * Math.cos(dPole) * Math.cos(a - aPole);
    const b = Math.asin(Math.max(-1.0, Math.min(1.0, sinB))) / rad;
    const cosB = Math.cos(b * rad);
    const yL = Math.sin(d) - Math.sin(b * rad) * Math.sin(dPole);
    const xL = Math.cos(d) * Math.sin(a - aPole) * Math.cos(dPole);
    const l = (33.0 + Math.atan2(xL, yL) / rad + 360.0) % 360.0;

    return { ra: Math.round(ra * 100) / 100, dec: Math.round(dec * 100) / 100, l: Math.round(l * 100) / 100, b: Math.round(b * 100) / 100 };
  };

  // Generate Galactic Plane Curve points
  const galacticPoints: Array<{ x: number; y: number }> = [];
  for (let l = 0; l <= 360; l += 4) {
    const lRad = l * (Math.PI / 180.0);
    // Galactic to Equatorial inverse transformation
    const sinDec = Math.cos(27.12825 * Math.PI / 180.0) * Math.sin(lRad - 33.0 * Math.PI / 180.0);
    const dec = Math.asin(sinDec) * (180.0 / Math.PI);
    const cosDec = Math.cos(dec * Math.PI / 180.0);
    const cosDeltaRa = Math.cos(lRad - 33.0 * Math.PI / 180.0) / (cosDec || 1.0);
    const ra = (192.85948 + Math.atan2(sinDec, cosDeltaRa) * (180.0 / Math.PI) + 360.0) % 360.0;
    galacticPoints.push({ x: toX(ra), y: toY(dec) });
  }

  // Generate Ecliptic Plane points (Obliquity epsilon ~ 23.44 deg)
  const eclipticPoints: Array<{ x: number; y: number }> = [];
  const epsRad = 23.44 * (Math.PI / 180.0);
  for (let lambda = 0; lambda <= 360; lambda += 3) {
    const lamRad = lambda * (Math.PI / 180.0);
    const ra = Math.atan2(Math.sin(lamRad) * Math.cos(epsRad), Math.cos(lamRad)) * (180.0 / Math.PI);
    const dec = Math.asin(Math.sin(lamRad) * Math.sin(epsRad)) * (180.0 / Math.PI);
    const normRa = (ra + 360.0) % 360.0;
    eclipticPoints.push({ x: toX(normRa), y: toY(dec) });
  }

  return (
    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white tracking-wide">
            3D Celestial Sphere & SPHEREx All-Sky Survey Coverage
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showGalacticPlane}
              onChange={(e) => setShowGalacticPlane(e.target.checked)}
              className="accent-purple-400 rounded"
            />
            <span className="text-purple-300">Galactic Plane</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showEclipticPlane}
              onChange={(e) => setShowEclipticPlane(e.target.checked)}
              className="accent-amber-400 rounded"
            />
            <span className="text-amber-300">Ecliptic Plane</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showCVZ}
              onChange={(e) => setShowCVZ(e.target.checked)}
              className="accent-cyan-400 rounded"
            />
            <span className="text-cyan-300">NEP/SEP Deep CVZ</span>
          </label>
        </div>
      </div>

      {/* Main Interactive Celestial Map Viewport */}
      <div className="w-full bg-space-950 border border-space-800 rounded-lg p-2 overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = (e.clientX - rect.left) * (mapWidth / rect.width);
            const svgY = (e.clientY - rect.top) * (mapHeight / rect.height);
            if (svgX >= pad.left && svgX <= mapWidth - pad.right && svgY >= pad.top && svgY <= mapHeight - pad.bottom) {
              setHoverCoords(fromPixelToCoords(svgX, svgY));
            } else {
              setHoverCoords(null);
            }
          }}
          onMouseLeave={() => setHoverCoords(null)}
          onClick={(e) => {
            if (hoverCoords) {
              onSelectCoordinates(hoverCoords.ra, hoverCoords.dec, `Field (${hoverCoords.ra}°, ${hoverCoords.dec}°)`);
            }
          }}
          className="w-full h-auto min-w-[700px] select-none cursor-crosshair"
        >
          {/* Background Celestial Grid Lines */}
          {[0, 60, 120, 180, 240, 300, 360].map((raVal) => {
            const x = toX(raVal);
            return (
              <g key={`grid-ra-${raVal}`}>
                <line x1={x} y1={pad.top} x2={x} y2={mapHeight - pad.bottom} stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
                <text x={x} y={mapHeight - pad.bottom + 16} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                  {raVal}° ({(raVal / 15).toFixed(0)}h)
                </text>
              </g>
            );
          })}

          {[-60, -30, 0, 30, 60].map((decVal) => {
            const y = toY(decVal);
            return (
              <g key={`grid-dec-${decVal}`}>
                <line x1={pad.left} y1={y} x2={mapWidth - pad.right} y2={y} stroke="#1e293b" strokeDasharray="2,2" strokeWidth="0.8" />
                <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                  {decVal >= 0 ? `+${decVal}` : decVal}°
                </text>
              </g>
            );
          })}

          {/* Border Frame */}
          <rect
            x={pad.left}
            y={pad.top}
            width={mapWidth - pad.left - pad.right}
            height={mapHeight - pad.top - pad.bottom}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Ecliptic Plane Line */}
          {showEclipticPlane && (
            <path
              d={eclipticPoints.sort((a, b) => a.x - b.x).reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="4,3"
              className="opacity-70"
            />
          )}

          {/* Galactic Plane S-Curve */}
          {showGalacticPlane && (
            <path
              d={galacticPoints.sort((a, b) => a.x - b.x).reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.5"
              strokeDasharray="3,2"
              className="opacity-75"
            />
          )}

          {/* North Ecliptic Pole (NEP) Deep Continuous Viewing Zone Circle */}
          {showCVZ && (
            <g>
              <circle
                cx={toX(270.3317)}
                cy={toY(66.5614)}
                r="36"
                fill="rgba(0, 240, 255, 0.12)"
                stroke="#00f0ff"
                strokeWidth="1.2"
                strokeDasharray="3,3"
                className="animate-pulse"
              />
              <text
                x={toX(270.3317)}
                y={toY(66.5614) - 42}
                textAnchor="middle"
                fill="#00f0ff"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                North Ecliptic Pole CVZ (&gt;100 Overlapping Passes)
              </text>

              {/* South Ecliptic Pole (SEP) Circle */}
              <circle
                cx={toX(90.3317)}
                cy={toY(-66.5614)}
                r="36"
                fill="rgba(168, 85, 247, 0.12)"
                stroke="#a855f7"
                strokeWidth="1.2"
                strokeDasharray="3,3"
              />
              <text
                x={toX(90.3317)}
                y={toY(-66.5614) + 48}
                textAnchor="middle"
                fill="#c084fc"
                fontSize="9"
                fontFamily="monospace"
              >
                South Ecliptic Pole CVZ
              </text>
            </g>
          )}

          {/* Currently Focused Observatory Reticle */}
          <g>
            <circle
              cx={toX(activeRa)}
              cy={toY(activeDec)}
              r="12"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              className="animate-ping opacity-60"
            />
            <circle
              cx={toX(activeRa)}
              cy={toY(activeDec)}
              r="6"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2"
            />
          </g>

          {/* Benchmark Target Markers */}
          {targets.map((tgt) => {
            const ra = tgt.ra ?? tgt.ra_deg ?? 0;
            const dec = tgt.dec ?? tgt.dec_deg ?? 0;
            const cx = toX(ra);
            const cy = toY(dec);
            const isHovered = hoveredTarget?.id === tgt.id;
            const isCategoryPlanetX = tgt.category === 'planet-x';

            return (
              <g
                key={`tgt-marker-${tgt.id}`}
                onMouseEnter={() => setHoveredTarget(tgt)}
                onMouseLeave={() => setHoveredTarget(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTarget(tgt);
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : 5}
                  fill={isCategoryPlanetX ? '#f43f5e' : tgt.status === 'VERIFIED' ? '#10b981' : '#f59e0b'}
                  stroke="#0b111e"
                  strokeWidth="1.5"
                  className="transition-all"
                />
                <text
                  x={cx + 7}
                  y={cy - 4}
                  fill={isHovered ? '#ffffff' : '#cbd5e1'}
                  fontSize={isHovered ? '10' : '8.5'}
                  fontFamily="monospace"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {tgt.name.slice(0, 18)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Coordinate HUD Badge */}
        {hoverCoords && (
          <div className="absolute top-4 left-4 bg-space-900/95 backdrop-blur border border-cyan-500/40 rounded-lg p-2.5 text-xs font-mono shadow-xl pointer-events-none space-y-0.5">
            <div className="text-cyan-300 font-bold">
              RA: {hoverCoords.ra.toFixed(2)}° ({(hoverCoords.ra / 15).toFixed(2)}h) • Dec: {hoverCoords.dec >= 0 ? '+' : ''}{hoverCoords.dec.toFixed(2)}°
            </div>
            <div className="text-purple-300 text-[10px]">
              Galactic (l, b): [{hoverCoords.l.toFixed(1)}°, {hoverCoords.b >= 0 ? '+' : ''}{hoverCoords.b.toFixed(1)}°]
            </div>
            <div className="text-slate-400 text-[9px] pt-1 border-t border-space-800">
              Click anywhere on celestial sphere to re-center observatory
            </div>
          </div>
        )}

        {/* Hover Target Quick Tooltip */}
        {hoveredTarget && (
          <div className="absolute top-4 right-4 bg-space-900/95 backdrop-blur border border-emerald-500/40 rounded-lg p-3 text-xs font-mono shadow-xl pointer-events-none space-y-1">
            <div className="text-emerald-300 font-bold">{hoveredTarget.name}</div>
            <div className="text-slate-300">
              Coord: {(hoveredTarget.ra ?? hoveredTarget.ra_deg ?? 0).toFixed(4)}°, {(hoveredTarget.dec ?? hoveredTarget.dec_deg ?? 0).toFixed(4)}°
            </div>
            <div className="text-cyan-300 text-[11px]">Category: {hoveredTarget.category}</div>
            <div className="text-slate-400 text-[10px]">Exposures: {hoveredTarget.observation_count} Passes in DR1</div>
          </div>
        )}
      </div>

      {/* Legend & Instructions Strip */}
      <div className="p-3 bg-space-950/70 border border-space-800 rounded-lg text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>NASA Verified DR1 Targets</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Sedna &amp; Planet X Search Sector</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Future Release Fields</span>
          </span>
        </div>
        <span className="text-slate-500 text-[11px]">
          Equatorial J2000 Frame • Plate Scale 6.2″/pixel • SPHEREx Polar Sun-Synchronous Orbit
        </span>
      </div>
    </div>
  );
};
