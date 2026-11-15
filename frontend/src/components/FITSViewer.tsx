import React, { useState, useRef, useEffect } from 'react';
import { CatalogMatchResult, FieldCatalogSource } from '../types';
import { crossmatchCatalogs, fetchFieldCatalogSources } from '../services/api';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Crosshair,
  Sliders,
  Download,
  Layers,
  RotateCcw,
  Move,
  MousePointer,
  Maximize,
  Compass,
  Star,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';

interface FITSViewerProps {
  title: string;
  imageUrl: string;
  obsId: string;
  centerRa?: number;
  centerDec?: number;
  detector?: number;
  mjd?: number;
  pixelScaleArcsec?: number;
  onPixelClick?: (x: number, y: number, ra: number, dec: number) => void;
  crosshairPosition?: { x: number; y: number } | null;
}

export const FITSViewer: React.FC<FITSViewerProps> = ({
  title,
  imageUrl,
  obsId,
  centerRa = 270.3317,
  centerDec = 66.5614,
  detector = 4,
  mjd = 60789.25,
  pixelScaleArcsec = 6.2,
  onPixelClick,
  crosshairPosition,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [stretch, setStretch] = useState<'percentile' | 'asinh' | 'linear' | 'sqrt' | 'log'>('percentile');
  const [colormap, setColormap] = useState<'viridis' | 'inferno' | 'plasma' | 'grayscale' | 'coolwarm'>('inferno');
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [crosshairMode, setCrosshairMode] = useState<'mouse' | 'center'>('mouse'); // 'mouse' = dynamic, 'center' = static
  const [viewFitMode, setViewFitMode] = useState<'fit' | 'fill' | 'actual'>('fill'); // 'fill' fills the viewport at 1x
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [invert, setInvert] = useState<boolean>(false);

  const [hoverCoords, setHoverCoords] = useState<{
    x: number;
    y: number;
    ra: number;
    dec: number;
    clientX: number;
    clientY: number;
  } | null>(null);

  const [imageError, setImageError] = useState<boolean>(false);

  // Standout Feature: Multi-Catalog Cross-Matching (Gaia DR3 / MPC / NEOSSat)
  const [catalogMatch, setCatalogMatch] = useState<CatalogMatchResult | null>(null);
  const [showCatalogDetails, setShowCatalogDetails] = useState<boolean>(false);

  // Standout Feature: Field Catalog Sources Canvas Overlay
  const [fieldSources, setFieldSources] = useState<FieldCatalogSource[]>([]);
  const [showFieldReticles, setShowFieldReticles] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    crossmatchCatalogs(centerRa, centerDec)
      .then((res) => {
        if (isMounted) setCatalogMatch(res);
      })
      .catch((err) => console.error('Catalog crossmatch error:', err));

    fetchFieldCatalogSources(centerRa, centerDec, 10.0, 512)
      .then((data) => {
        if (isMounted) setFieldSources(data);
      })
      .catch((err) => console.error('Field sources error:', err));

    return () => {
      isMounted = false;
    };
  }, [centerRa, centerDec]);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.35, 12));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.35, 0.4));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 12));
  };

  // Mouse Drag to Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (!imageRef.current || !containerRef.current) return;
    const imgRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const clientX = e.clientX - imgRect.left;
    const clientY = e.clientY - imgRect.top;

    const relContainerX = e.clientX - containerRect.left;
    const relContainerY = e.clientY - containerRect.top;

    if (clientX >= 0 && clientX <= imgRect.width && clientY >= 0 && clientY <= imgRect.height) {
      const relX = clientX / imgRect.width;
      const relY = clientY / imgRect.height;

      // 2040x2040 SPHEREx pixel coordinate
      const pixelX = Math.round(relX * 2040);
      const pixelY = Math.round((1 - relY) * 2040);

      // Astrometric coordinates
      const dX_arcsec = (relX - 0.5) * 2040 * pixelScaleArcsec;
      const dY_arcsec = (0.5 - relY) * 2040 * pixelScaleArcsec;
      const cosDec = Math.cos((centerDec * Math.PI) / 180);
      const raVal = centerRa - (dX_arcsec / 3600) / (cosDec || 1);
      const decVal = centerDec + (dY_arcsec / 3600);

      setHoverCoords({
        x: pixelX,
        y: pixelY,
        ra: ((raVal % 360) + 360) % 360,
        dec: Math.max(-90, Math.min(90, decVal)),
        clientX: relContainerX,
        clientY: relContainerY,
      });
    } else {
      setHoverCoords(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = () => {
    if (hoverCoords && onPixelClick && !isDragging) {
      onPixelClick(hoverCoords.x, hoverCoords.y, hoverCoords.ra, hoverCoords.dec);
    }
  };

  // CSS filter based on colormap and stretch
  const getFilterStyle = () => {
    let filter = '';
    if (invert) filter += 'invert(1) ';
    if (colormap === 'grayscale') {
      filter += 'grayscale(1) ';
    } else if (colormap === 'inferno') {
      filter += 'sepia(0.8) hue-rotate(-20deg) saturate(2.5) contrast(1.2) ';
    } else if (colormap === 'plasma') {
      filter += 'sepia(0.5) hue-rotate(240deg) saturate(2.2) contrast(1.2) ';
    } else if (colormap === 'coolwarm') {
      filter += 'hue-rotate(180deg) saturate(1.8) contrast(1.1) ';
    }

    if (stretch === 'asinh') {
      filter += 'contrast(1.4) brightness(1.1)';
    } else if (stretch === 'log') {
      filter += 'contrast(1.6) brightness(1.3)';
    } else if (stretch === 'sqrt') {
      filter += 'contrast(1.2) brightness(1.1)';
    }
    return filter.trim();
  };

  const viewerHeightClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-space-950 p-4 flex flex-col'
    : 'relative w-full h-[620px] sm:h-[680px] lg:h-[740px] bg-space-950 flex flex-col';

  return (
    <div className={`bg-space-900 border border-space-800 rounded-xl overflow-hidden shadow-2xl flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* Header Bar */}
      <div className="bg-space-950 px-4 py-2.5 border-b border-space-800 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-100">{title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-800 text-cyan-300 border border-space-700">
            {obsId}
          </span>
        </div>

        {/* Viewer Tools */}
        <div className="flex flex-wrap items-center space-x-1.5 text-xs font-mono">
          {/* View Mode (Fill vs Fit) */}
          <div className="flex items-center p-0.5 bg-space-900 rounded border border-space-800 text-[10px]">
            <button
              onClick={() => { setViewFitMode('fill'); setZoom(1); }}
              className={`px-2 py-0.5 rounded transition ${viewFitMode === 'fill' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400'}`}
              title="Expand image to fill viewport"
            >
              Fill 1x
            </button>
            <button
              onClick={() => { setViewFitMode('fit'); setZoom(1); }}
              className={`px-2 py-0.5 rounded transition ${viewFitMode === 'fit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400'}`}
              title="Fit entire detector"
            >
              Fit
            </button>
            <button
              onClick={() => { setViewFitMode('actual'); setZoom(1.8); }}
              className={`px-2 py-0.5 rounded transition ${viewFitMode === 'actual' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400'}`}
              title="True 1:1 pixel scale"
            >
              1:1 Pixels
            </button>
          </div>

          {/* Colormap Selector */}
          <select
            value={colormap}
            onChange={(e: any) => setColormap(e.target.value)}
            className="bg-space-900 border border-space-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-400"
            title="Scientific Colormap"
          >
            <option value="inferno">Inferno</option>
            <option value="viridis">Viridis</option>
            <option value="plasma">Plasma</option>
            <option value="grayscale">Grayscale</option>
            <option value="coolwarm">Coolwarm</option>
          </select>

          {/* Stretch Selector */}
          <select
            value={stretch}
            onChange={(e: any) => setStretch(e.target.value)}
            className="bg-space-900 border border-space-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-400"
            title="Contrast Stretch Function"
          >
            <option value="percentile">Percentile 99.5%</option>
            <option value="asinh">Asinh (Nonlinear)</option>
            <option value="sqrt">Square Root</option>
            <option value="log">Logarithmic</option>
            <option value="linear">Linear</option>
          </select>

          {/* Crosshair Dynamic vs Center Mode Button */}
          <button
            onClick={() => {
              if (!showCrosshair) {
                setShowCrosshair(true);
                setCrosshairMode('mouse');
              } else if (crosshairMode === 'mouse') {
                setCrosshairMode('center');
              } else {
                setShowCrosshair(false);
              }
            }}
            className={`flex items-center space-x-1 px-2 py-1 rounded border text-[11px] transition ${
              showCrosshair
                ? crosshairMode === 'mouse'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-space-900 text-slate-400 border-space-800'
            }`}
            title="Toggle Reticle: Dynamic Mouse -> Center Lock -> Off"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{showCrosshair ? (crosshairMode === 'mouse' ? 'Dynamic Reticle' : 'Center Lock') : 'Reticle Off'}</span>
          </button>

          {/* Catalogue Reticles Overlay Toggle */}
          <button
            onClick={() => setShowFieldReticles(!showFieldReticles)}
            className={`flex items-center space-x-1 px-2 py-1 rounded border text-[11px] transition ${
              showFieldReticles
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-space-900 text-slate-400 border-space-800'
            }`}
            title="Toggle External Astrometric Catalogue Overlay Reticles (Gaia DR3 / MPC)"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{showFieldReticles ? `Catalogue (${fieldSources.length})` : 'Catalogue Off'}</span>
          </button>

          {/* Reset Zoom & Pan */}
          <button
            onClick={handleReset}
            className="p-1.5 bg-space-900 hover:bg-space-800 text-slate-300 border border-space-800 rounded"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Buttons */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 bg-space-900 hover:bg-space-800 text-slate-300 border border-space-800 rounded"
            title="Zoom In (or use Mouse Wheel)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 bg-space-900 hover:bg-space-800 text-slate-300 border border-space-800 rounded"
            title="Zoom Out (or use Mouse Wheel)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 py-1 bg-space-900 text-slate-300 border border-space-800 rounded text-[10px] font-mono">
            {zoom.toFixed(1)}x
          </span>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-space-900 hover:bg-space-800 text-slate-300 border border-space-800 rounded"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Dynamic Mouse Reticle & Drag-to-Pan */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoverCoords(null);
        }}
        onClick={handleCanvasClick}
        className={`${viewerHeightClass} flex-1 overflow-hidden select-none bg-astro-grid relative flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-crosshair'
        }`}
      >
        {/* Astrometric Catalog Cross-Match HUD Badge */}
        {catalogMatch && (
          <div className="absolute top-3 left-3 z-20 font-mono">
            <button
              onClick={() => setShowCatalogDetails(!showCatalogDetails)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] backdrop-blur border transition shadow-lg ${
                catalogMatch.is_known_object
                  ? 'bg-space-950/90 text-cyan-300 border-cyan-500/40 hover:bg-space-900'
                  : 'bg-space-950/90 text-purple-300 border-purple-500/40 hover:bg-space-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {catalogMatch.gaia_match
                  ? `Gaia DR3: ${catalogMatch.gaia_match.designation || catalogMatch.gaia_match.source_id.slice(0, 16)}`
                  : catalogMatch.mpc_asteroid_match
                  ? `MPC: ${catalogMatch.mpc_asteroid_match.designation}`
                  : 'Catalog: Uncataloged Candidate'}
              </span>
              {showCatalogDetails ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {/* Expanded Catalog Details Popover */}
            {showCatalogDetails && (
              <div className="mt-1.5 w-72 bg-space-950/95 backdrop-blur border border-space-800 rounded-lg p-3 text-xs shadow-2xl space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-space-800">
                  <span className="font-bold text-slate-200">Catalog Identification</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-space-900 text-cyan-400 border border-cyan-500/30">
                    {catalogMatch.classification}
                  </span>
                </div>

                {catalogMatch.gaia_match && (
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div>Source: <span className="text-white font-bold">{catalogMatch.gaia_match.source_id}</span></div>
                    <div>G Mag: <span className="text-cyan-300 font-bold">{catalogMatch.gaia_match.g_mag}</span></div>
                    {catalogMatch.gaia_match.pm_ra_mas_yr !== undefined && (
                      <div>
                        PM: [{catalogMatch.gaia_match.pm_ra_mas_yr}, {catalogMatch.gaia_match.pm_dec_mas_yr}] mas/yr
                      </div>
                    )}
                    {catalogMatch.gaia_match.parallax_mas && (
                      <div>Parallax: {catalogMatch.gaia_match.parallax_mas} mas (d ≈ {catalogMatch.gaia_match.distance_pc} pc)</div>
                    )}
                  </div>
                )}

                {catalogMatch.mpc_asteroid_match && (
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div>Object: <span className="text-rose-300 font-bold">{catalogMatch.mpc_asteroid_match.designation}</span></div>
                    <div>Type: <span className="text-slate-200">{catalogMatch.mpc_asteroid_match.orbit_type}</span></div>
                    <div>Semi-Major Axis (a): <span className="text-cyan-300">{catalogMatch.mpc_asteroid_match.semi_major_axis_au} AU</span></div>
                    <div>Apparent V: <span className="text-slate-200">{catalogMatch.mpc_asteroid_match.apparent_magnitude_v} mag</span></div>
                    <div>Daily Motion: <span className="text-amber-400">{catalogMatch.mpc_asteroid_match.predicted_motion_arcsec_day} ″/day</span></div>
                  </div>
                )}

                {!catalogMatch.is_known_object && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    No matching source within 15″ in Gaia DR3 or Minor Planet Center archives. Qualifies as potential new transient or outer solar system candidate.
                  </p>
                )}

                <div className="pt-1.5 border-t border-space-800 text-[10px] text-slate-500">
                  {catalogMatch.notes}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Transform Container with Pan and Zoom */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
            width: viewFitMode === 'fill' ? '96%' : viewFitMode === 'actual' ? '120%' : 'auto',
            height: viewFitMode === 'fill' ? '94%' : viewFitMode === 'actual' ? '120%' : 'auto',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          {!imageError ? (
            <img
              ref={imageRef}
              src={imageUrl}
              alt={`SPHEREx Observation ${obsId}`}
              style={{ filter: getFilterStyle() }}
              onError={() => setImageError(true)}
              className={`rounded shadow-2xl pointer-events-none select-none transition-all ${
                viewFitMode === 'fill'
                  ? 'w-full h-full object-cover sm:object-contain min-h-[560px] min-w-[560px]'
                  : viewFitMode === 'actual'
                  ? 'min-w-[800px] min-h-[800px] object-contain'
                  : 'max-h-[660px] max-w-full object-contain'
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 font-mono text-xs space-y-2">
              <Layers className="w-16 h-16 text-cyan-400 opacity-60 animate-pulse" />
              <span className="text-slate-200 font-semibold text-sm">{obsId}</span>
              <span className="text-slate-500 text-[11px]">Generating calibrated contrast-stretched preview from archive...</span>
            </div>
          )}

          {/* Static Center Boresight Crosshair (Only when crosshairMode === 'center') */}
          {showCrosshair && crosshairMode === 'center' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-16 h-16">
                <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-cyan-400/80 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-cyan-400/80 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                <div className="absolute inset-3 border-2 border-cyan-400/70 rounded-full" />
              </div>
            </div>
          )}

          {/* Target Overlay Marker if provided */}
          {crosshairPosition && (
            <div
              style={{
                left: `${(crosshairPosition.x / 2040) * 100}%`,
                top: `${(1 - crosshairPosition.y / 2040) * 100}%`,
              }}
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="w-8 h-8 border-2 border-emerald-400 rounded-full animate-ping opacity-75" />
              <div className="w-5 h-5 border-2 border-emerald-400 rounded-full absolute inset-1.5" />
            </div>
          )}

          {/* External Catalogue Overlay Markers */}
          {showFieldReticles && fieldSources.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {fieldSources.map((src, idx) => {
                const isMpc = src.catalog === 'MPC';
                const leftPct = (src.pixel_x / 512.0) * 100.0;
                const topPct = (src.pixel_y / 512.0) * 100.0;
                if (leftPct < 2 || leftPct > 98 || topPct < 2 || topPct > 98) return null;

                return (
                  <div
                    key={`cat-ret-${idx}`}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] pointer-events-none"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full border ${isMpc ? 'border-rose-400 bg-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                      <div className={`absolute w-7 h-[1px] ${isMpc ? 'bg-rose-400/80' : 'bg-emerald-400/80'}`} />
                      <div className={`absolute h-7 w-[1px] ${isMpc ? 'bg-rose-400/80' : 'bg-emerald-400/80'}`} />
                    </div>
                    <div className={`absolute left-5 -top-2 whitespace-nowrap px-1 py-0.5 rounded backdrop-blur bg-space-950/90 border ${isMpc ? 'border-rose-500/50 text-rose-300' : 'border-emerald-500/50 text-emerald-300'}`}>
                      {src.designation || src.source_id.slice(0, 14)} ({src.mag_band}={src.mag.toFixed(1)})
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Interactive Mouse Crosshair & Hairline Laser Guides */}
        {showCrosshair && crosshairMode === 'mouse' && hoverCoords && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {/* Horizontal Hairline Laser */}
            <div
              style={{ top: `${hoverCoords.clientY}px` }}
              className="absolute left-0 right-0 h-[1px] bg-cyan-400/60 shadow-[0_0_6px_rgba(0,240,255,0.7)]"
            />
            {/* Vertical Hairline Laser */}
            <div
              style={{ left: `${hoverCoords.clientX}px` }}
              className="absolute top-0 bottom-0 w-[1px] bg-cyan-400/60 shadow-[0_0_6px_rgba(0,240,255,0.7)]"
            />

            {/* Dynamic Reticle Ring following mouse */}
            <div
              style={{
                left: `${hoverCoords.clientX}px`,
                top: `${hoverCoords.clientY}px`,
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="w-8 h-8 border border-cyan-400/80 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping" />
              </div>

              {/* Dynamic Floating Coordinate HUD Badge */}
              <div className="absolute left-6 -top-3 bg-space-950/95 backdrop-blur border border-cyan-500/50 rounded-md px-2.5 py-1 text-[10px] font-mono whitespace-nowrap shadow-xl space-y-0.5">
                <div className="text-cyan-300 font-bold">
                  RA: {hoverCoords.ra.toFixed(4)}° | Dec: {hoverCoords.dec >= 0 ? '+' : ''}{hoverCoords.dec.toFixed(4)}°
                </div>
                <div className="text-slate-400 text-[9px]">
                  Pixel: [{hoverCoords.x}, {hoverCoords.y}] | Det D{detector}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Astrometric Scale Bar */}
        <div className="absolute bottom-3 left-3 bg-space-950/85 backdrop-blur border border-space-800 rounded px-2.5 py-1 text-[10px] font-mono text-slate-300 pointer-events-none flex items-center space-x-2 z-20">
          <span>Scale:</span>
          <div className="flex flex-col items-center">
            <div className="w-16 h-[2px] bg-cyan-400" />
            <span className="text-[9px] text-cyan-300">~1.6 arcmin (16 px)</span>
          </div>
          <span className="text-slate-500">| 6.2″/px</span>
        </div>

        {/* Dynamic Center Coordinate & Pan Position HUD */}
        <div className="absolute bottom-3 right-3 bg-space-950/90 backdrop-blur border border-space-800 rounded px-3 py-1.5 text-[11px] font-mono text-slate-200 pointer-events-none shadow-lg z-20">
          <div className="flex items-center space-x-2">
            <Move className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <div>
              <div className="text-cyan-300">
                Center: RA {centerRa.toFixed(4)}°, Dec {centerDec >= 0 ? '+' : ''}{centerDec.toFixed(4)}°
              </div>
              <div className="text-slate-400 text-[10px]">
                Pan Offset: [{pan.x}px, {pan.y}px] | Zoom: {zoom.toFixed(1)}x (Drag to pan, Scroll to zoom)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="bg-space-950/70 px-4 py-2 border-t border-space-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center space-x-3">
          <span>SPHEREx Detector: <strong className="text-slate-200">Band {detector}</strong></span>
          <span>•</span>
          <span>Sampling: <strong className="text-slate-200">{pixelScaleArcsec}″/pix</strong></span>
          <span>•</span>
          <span>Pan: <strong className="text-cyan-300">Click & Drag with Mouse</strong></span>
          <span>•</span>
          <span>Zoom: <strong className="text-cyan-300">Scroll Wheel</strong></span>
        </div>
        <a
          href={imageUrl}
          download={`spherex_${obsId}_preview.png`}
          className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition"
        >
          <Download className="w-3 h-3" />
          <span>Save PNG</span>
        </a>
      </div>
    </div>
  );
};
