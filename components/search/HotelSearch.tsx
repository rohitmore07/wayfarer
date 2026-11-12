'use client';

import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Info, Loader2, MapPin, SlidersHorizontal } from 'lucide-react';
import { CITIES } from '@/lib/data/cities';
import { AMENITY_FILTERS, PROPERTY_TYPES } from '@/lib/providers/hotels';
import type { Hotel } from '@/lib/types';
import { HotelCard } from '@/components/cards/HotelCard';
import { TripMap } from '@/components/trip/TripMap';
import { cn, inr, todayISO, addDays } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

type Result = { hotels: (Hotel & { score?: number; reasons?: string[] })[]; city: { id: string; name: string } };

export function HotelSearch({ defaultCity }: { defaultCity?: string }) {
  const [cityId, setCityId] = useState(defaultCity ?? 'kyoto');
  const [checkIn, setCheckIn] = useState(addDays(todayISO(), 45));
  const [checkOut, setCheckOut] = useState(addDays(todayISO(), 52));
  const [tier, setTier] = useState<'any' | 'budget' | 'comfort' | 'luxury'>('any');
  const [maxPrice, setMaxPrice] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [sort, setSort] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating'>('recommended');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const rooms = 1;

  const search = async () => {
    setLoading(true);
    const res = await fetch('/api/hotels/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityId,
        tier,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        amenities,
        propertyTypes,
        sort,
      }),
    });
    const data = await res.json();
    setResult(res.ok ? data : { hotels: [], city: { id: cityId, name: cityId } });
    setLoading(false);
  };

  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, tier, maxPrice, minRating, amenities, propertyTypes, sort]);

  const hotels = result?.hotels ?? [];
  const city = CITIES.find((c) => c.id === cityId);
  const mapPoints = useMemo(
    () => [
      ...hotels.map((h) => ({ id: h.id, name: h.name, lat: h.lat, lng: h.lng, label: '•' })),
      ...(city?.pois.slice(0, 5).map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, label: '★' })) ?? []),
    ],
    [hotels, city]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Destination</span>
            <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="field py-2.5 text-sm">
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Check-in</span>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="field py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Check-out</span>
            <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} className="field py-2.5 text-sm" />
          </label>
          <div className="flex items-end">
            <span className="rounded-xl bg-sand px-3 py-2.5 text-xs font-medium text-ink-soft">{nights} nights</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <div className="flex rounded-full border border-line bg-parchment p-1">
            {(['any', 'budget', 'comfort', 'luxury'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={cn('rounded-full px-2.5 py-1.5 text-2xs font-medium capitalize transition', tier === t ? 'bg-white text-ink shadow-sm' : 'text-ink-mute')}
              >
                {t === 'any' ? 'All styles' : t}
              </button>
            ))}
          </div>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="chip bg-white">
            <option value={0}>Any guest score</option>
            <option value={8}>8.0+</option>
            <option value={8.5}>8.5+</option>
            <option value={9}>9.0+</option>
          </select>
          <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="chip bg-white">
            <option value={0}>Any price</option>
            {[5000, 8000, 12000, 18000, 25000, 40000].map((p) => (
              <option key={p} value={p}>
                Under {inr(p)}/night
              </option>
            ))}
          </select>
          {PROPERTY_TYPES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPropertyTypes((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))}
              className={cn('chip', propertyTypes.includes(p.id) && 'chip-active')}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {AMENITY_FILTERS.slice(0, 8).map((a) => (
            <button
              key={a}
              onClick={() => setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))}
              className={cn('chip text-2xs', amenities.includes(a) && 'chip-active')}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-mute">
          {loading ? 'Ranking stays…' : `${hotels.length} properties in ${city?.name}`}
        </p>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={12} className="text-ink-faint" />
          {([
            ['recommended', 'Best match'],
            ['price-asc', 'Price ↑'],
            ['price-desc', 'Price ↓'],
            ['rating', 'Guest score'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn('rounded-full border px-3 py-1.5 text-2xs font-medium', sort === key ? 'border-ink bg-white text-ink' : 'border-line bg-white text-ink-mute')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-line bg-parchment/70 px-4 py-2.5 text-2xs leading-relaxed text-ink-mute">
        <Info size={12} className="mt-0.5 shrink-0" />
        Demo hotel inventory: properties are fictional but priced realistically against the destination. The scoring
        engine (price fit, guest score, distance to your itinerary) is real and is what a live bedbank would feed.
      </div>

      {showMap && mapPoints.length ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-2xs text-ink-mute">
              <MapPin size={11} className="mr-1 inline" />
              Hotels (•) and headline attractions (★) on the map
            </p>
            <button onClick={() => setShowMap(false)} className="text-2xs text-ink-faint hover:text-ink">
              Hide map
            </button>
          </div>
          <TripMap points={mapPoints} height={260} showRoutes={false} />
        </div>
      ) : (
        <button onClick={() => setShowMap(true)} className="text-2xs font-medium text-clay-600 hover:underline">
          Show map
        </button>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[300px] animate-pulse rounded-2xl border border-line bg-white/60" />)
        ) : hotels.length ? (
          hotels.map((h) => (
            <HotelCard key={h.id} hotel={h} nights={nights} rooms={rooms} reasons={h.reasons} score={h.score} />
          ))
        ) : (
          <div className="md:col-span-2">
            <EmptyState icon={BedDouble} title="No stays match those filters" description="Try raising the price ceiling or clearing an amenity filter." />
          </div>
        )}
      </div>
    </div>
  );
}
