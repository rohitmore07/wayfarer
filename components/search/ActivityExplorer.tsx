'use client';

import { useEffect, useMemo, useState } from 'react';
import { Compass, Loader2, Search } from 'lucide-react';
import { CITIES } from '@/lib/data/cities';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { cn, inr } from '@/lib/utils';
import { EmptyState } from '@/components/ui';
import type { Poi } from '@/lib/types';

const CATEGORIES = [
  ['all', 'Everything'],
  ['attraction', 'Attractions'],
  ['food', 'Food & drink'],
  ['nature', 'Nature'],
  ['adventure', 'Adventure'],
  ['museum', 'Museums'],
  ['experience', 'Experiences'],
  ['shopping', 'Shopping'],
  ['nightlife', 'Nightlife'],
  ['viewpoint', 'Viewpoints'],
] as const;

const INTERESTS = ['culture', 'food', 'nature', 'adventure', 'art', 'history', 'photography', 'relaxation', 'family', 'anime', 'nightlife', 'shopping'];

type Item = Poi & { cityName?: string; country?: string };

export function ActivityExplorer({ defaultCity }: { defaultCity?: string }) {
  const [cityId, setCityId] = useState(defaultCity ?? 'all');
  const [category, setCategory] = useState<string>('all');
  const [interest, setInterest] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState(0);
  const [indoor, setIndoor] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (cityId !== 'all') params.set('cityId', cityId);
    if (category !== 'all') params.set('category', category);
    if (interest !== 'all') params.set('interest', interest);
    if (maxPrice) params.set('maxPrice', String(maxPrice));
    if (indoor !== 'all') params.set('indoor', indoor);
    if (q.trim()) params.set('q', q.trim());
    setLoading(true);
    fetch(`/api/activities?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setItems(d.activities ?? []))
      .finally(() => setLoading(false));
  }, [cityId, category, interest, maxPrice, indoor, q]);

  const grouped = useMemo(() => {
    if (cityId !== 'all') return null;
    const map = new Map<string, Item[]>();
    items.forEach((p) => {
      const key = p.cityName ?? 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).slice(0, 8);
  }, [items, cityId]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Destination</span>
            <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="field py-2.5 text-sm">
              <option value="all">All destinations</option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Max price</span>
            <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="field py-2.5 text-sm">
              <option value={0}>Any budget</option>
              {[500, 1000, 2500, 5000, 10000].map((p) => (
                <option key={p} value={p}>
                  Under {inr(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Setting</span>
            <select value={indoor} onChange={(e) => setIndoor(e.target.value as never)} className="field py-2.5 text-sm">
              <option value="all">Indoor & outdoor</option>
              <option value="indoor">Indoor (rainy day)</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Search</span>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="temple, market, hike…" className="field py-2.5 pl-8 text-sm" />
            </div>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
          {CATEGORIES.map(([id, label]) => (
            <button key={id} onClick={() => setCategory(id)} className={cn('chip text-2xs', category === id && 'chip-active')}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button onClick={() => setInterest('all')} className={cn('chip text-2xs', interest === 'all' && 'chip-active')}>
            All interests
          </button>
          {INTERESTS.map((i) => (
            <button key={i} onClick={() => setInterest(i)} className={cn('chip text-2xs capitalize', interest === i && 'chip-active')}>
              {i}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-mute">
        {loading ? 'Finding experiences…' : `${items.length} experiences`}
        {cityId !== 'all' ? ` in ${CITIES.find((c) => c.id === cityId)?.name}` : ' across all destinations'}
      </p>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[340px] animate-pulse rounded-2xl border border-line bg-white/60" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Compass} title="Nothing matches yet" description="Widen the price range or clear a category filter." />
      ) : grouped ? (
        <div className="space-y-8">
          {grouped.map(([cityName, list]) => (
            <section key={cityName}>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="font-display text-xl text-ink">{cityName}</h2>
                <button onClick={() => setCityId(CITIES.find((c) => c.name === cityName)?.id ?? 'all')} className="text-2xs font-medium text-clay-600 hover:underline">
                  See all in {cityName}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.slice(0, 3).map((p) => (
                  <ActivityCard key={p.id} poi={p} cityName={p.cityName} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ActivityCard key={p.id} poi={p} cityName={p.cityName} />
          ))}
        </div>
      )}
    </div>
  );
}
