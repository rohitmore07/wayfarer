'use client';

import { useState } from 'react';
import { Layers, Minus, Plus } from 'lucide-react';
import type { DayActivity } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  label?: string;
  category?: string;
  day?: number;
}

const DAY_COLORS = ['#C05B34', '#1F4A43', '#C99A4B', '#3F6E8C', '#8A3A20', '#2F5F57', '#A97E33'];

/**
 * Offline vector map. Renders plotted coordinates + route lines with no tile
 * provider, so it works without a Google Maps key. When GOOGLE_MAPS_API_KEY is
 * present the surrounding panel links out to the real map per day.
 */
export function TripMap({
  points,
  height = 320,
  showRoutes = true,
  className,
  onSelect,
}: {
  points: MapPoint[];
  height?: number;
  showRoutes?: boolean;
  className?: string;
  onSelect?: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<MapPoint | null>(null);

  if (!points.length) {
    return (
      <div className={cn('flex items-center justify-center rounded-2xl border border-line bg-sand/60 text-xs text-ink-faint', className)} style={{ height }}>
        No mapped stops yet
      </div>
    );
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.006;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;
  const spanLat = Math.max(0.004, maxLat - minLat);
  const spanLng = Math.max(0.004, maxLng - minLng);

  const W = 800;
  const H = (height / 420) * 600;
  const project = (p: { lat: number; lng: number }) => ({
    x: ((p.lng - minLng) / spanLng) * W,
    y: H - ((p.lat - minLat) / spanLat) * H,
  });

  const routePoints = points.filter((p) => p.day !== undefined);
  const path = routePoints
    .map((p, i) => {
      const { x, y } = project(p);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-line bg-[#EDF0E9]', className)} style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" style={{ transform: `scale(${zoom})`, transition: 'transform 0.3s ease' }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#DCE3D6" strokeWidth="1" />
          </pattern>
          <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#DCE9EA" />
            <stop offset="100%" stopColor="#CFE0E2" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="#EFF2EA" />
        <rect width={W} height={H} fill="url(#grid)" />
        {/* stylised water + parks for texture */}
        <path d={`M0 ${H * 0.72} C ${W * 0.25} ${H * 0.62}, ${W * 0.55} ${H * 0.86}, ${W} ${H * 0.7} L ${W} ${H} L 0 ${H} Z`} fill="url(#water)" opacity="0.85" />
        <ellipse cx={W * 0.22} cy={H * 0.3} rx={W * 0.11} ry={H * 0.13} fill="#E3EBDC" />

        {/* stylised street network so the map reads as a map, not a blank canvas */}
        <g stroke="#E4E1D2" strokeLinecap="round" fill="none">
          <path d={`M0 ${H * 0.18} C ${W * 0.3} ${H * 0.26}, ${W * 0.62} ${H * 0.1}, ${W} ${H * 0.22}`} strokeWidth="9" opacity="0.9" />
          <path d={`M0 ${H * 0.46} C ${W * 0.28} ${H * 0.4}, ${W * 0.6} ${H * 0.56}, ${W} ${H * 0.44}`} strokeWidth="7" />
          <path d={`M${W * 0.34} 0 C ${W * 0.4} ${H * 0.3}, ${W * 0.26} ${H * 0.58}, ${W * 0.42} ${H}`} strokeWidth="8" opacity="0.85" />
          <path d={`M${W * 0.72} 0 C ${W * 0.66} ${H * 0.32}, ${W * 0.8} ${H * 0.6}, ${W * 0.68} ${H}`} strokeWidth="6" />
        </g>
        <g stroke="#FFFFFF" strokeLinecap="round" fill="none" opacity="0.55">
          <path d={`M0 ${H * 0.18} C ${W * 0.3} ${H * 0.26}, ${W * 0.62} ${H * 0.1}, ${W} ${H * 0.22}`} strokeWidth="3" />
          <path d={`M${W * 0.34} 0 C ${W * 0.4} ${H * 0.3}, ${W * 0.26} ${H * 0.58}, ${W * 0.42} ${H}`} strokeWidth="3" />
        </g>

        {showRoutes && routePoints.length > 1 ? (
          <path d={path} fill="none" stroke="#C05B34" strokeWidth="2.5" strokeDasharray="6 5" opacity="0.55" strokeLinecap="round" />
        ) : null}

        {points.map((p, i) => {
          const { x, y } = project(p);
          const color = DAY_COLORS[((p.day ?? 1) - 1) % DAY_COLORS.length];
          const isHover = hover?.id === p.id;
          return (
            <g
              key={`${p.id}-${i}`}
              transform={`translate(${x} ${y})`}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(p.id)}
              className="cursor-pointer"
            >
              <circle r={isHover ? 13 : 10} fill={color} opacity={0.18} />
              <circle r={isHover ? 7 : 5.5} fill={color} stroke="#fff" strokeWidth="2" />
              <text x="0" y="3" textAnchor="middle" fontSize="7.5" fill="#fff" fontWeight="600">
                {p.label ?? (p.day ?? '')}
              </text>
              {points.length <= 14 && p.name ? (
                <text
                  x="9"
                  y="3.5"
                  fontSize="9"
                  fontWeight="500"
                  fill="#4A453B"
                  stroke="#F7F5EF"
                  strokeWidth="3"
                  paintOrder="stroke"
                  strokeLinejoin="round"
                >
                  {p.name.length > 26 ? `${p.name.slice(0, 25)}…` : p.name}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-lg border border-line bg-white/90 p-1 backdrop-blur">
        <button onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))} className="rounded p-1 text-ink-mute hover:bg-sand hover:text-ink" aria-label="Zoom in">
          <Plus size={13} />
        </button>
        <button onClick={() => setZoom((z) => Math.max(1, z - 0.2))} className="rounded p-1 text-ink-mute hover:bg-sand hover:text-ink" aria-label="Zoom out">
          <Minus size={13} />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-2.5 py-1 text-[10px] text-ink-mute backdrop-blur">
        <Layers size={10} /> Vector map · add GOOGLE_MAPS_API_KEY for live tiles
      </div>

      {hover ? (
        <div className="pointer-events-none absolute left-3 top-3 max-w-[240px] rounded-lg border border-line bg-white/95 px-2.5 py-1.5 text-2xs shadow-card backdrop-blur">
          <p className="font-medium text-ink">{hover.name}</p>
          <p className="text-ink-faint">
            {hover.lat.toFixed(4)}, {hover.lng.toFixed(4)}
            {hover.day ? ` · Day ${hover.day}` : ''}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function pointsFromActivities(days: { day: number; activities: DayActivity[] }[]): MapPoint[] {
  return days.flatMap((d) =>
    d.activities.map((a, i) => ({
      id: `${d.day}-${a.id}`,
      name: a.name,
      lat: a.lat,
      lng: a.lng,
      label: String(i + 1),
      day: d.day,
      category: a.category,
    }))
  );
}
