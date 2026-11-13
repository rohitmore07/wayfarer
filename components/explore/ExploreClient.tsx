'use client';

import { SafeImage } from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Compass, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { CITIES, REGION_LABEL } from '@/lib/data/cities';
import { INTEREST_LABELS } from '@/lib/agent/destination';
import type { City, Interest } from '@/lib/types';
import { cn, inr } from '@/lib/utils';

const INTERESTS: Interest[] = ['culture', 'food', 'nature', 'adventure', 'art', 'history', 'photography', 'relaxation', 'family', 'nightlife', 'shopping', 'anime'];
const REGIONS = ['any', 'asia', 'europe', 'middle-east', 'americas'] as const;
const MONTHS = ['Any month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Match = { city: City; score: number; estimatedTotalPerPerson: number; withinBudget: boolean; reasons: string[] };

export function ExploreClient() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [region, setRegion] = useState<(typeof REGIONS)[number]>('any');
  const [budget, setBudget] = useState(120000);
  const [days, setDays] = useState(7);
  const [month, setMonth] = useState(0);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(
    () =>
      CITIES.filter((c) => region === 'any' || c.region === region).filter(
        (c) => !interests.length || interests.some((i) => c.interests.includes(i))
      ),
    [region, interests]
  );

  const find = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      budget: String(budget),
      days: String(days),
      region,
      interests: interests.join(','),
    });
    if (month) params.set('month', String(month));
    const res = await fetch(`/api/destinations?${params.toString()}`);
    const data = await res.json();
    const list: Match[] = (data.destinations ?? []).map((d: City & { match: Match }) => d.match ?? d);
    setMatches(list.slice(0, 6));
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* AI finder */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-parchment/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-clay-50 text-clay-600">
              <Wand2 size={13} />
            </span>
            <div>
              <p className="text-[13px] font-medium text-ink">AI destination finder</p>
              <p className="text-2xs text-ink-faint">Tell it your budget, month and interests — it ranks the catalogue.</p>
            </div>
          </div>
          <button onClick={find} className="btn-primary text-xs" disabled={loading}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            Find my destination
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-2xs text-ink-faint">Budget per person</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={30000}
                max={400000}
                step={10000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-clay-500"
              />
              <span className="w-16 shrink-0 text-right text-xs font-medium text-ink">{inr(budget, { compact: true })}</span>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-2xs text-ink-faint">Trip length</span>
            <div className="flex items-center gap-2">
              <input type="range" min={2} max={16} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full accent-clay-500" />
              <span className="w-16 shrink-0 text-right text-xs font-medium text-ink">{days} days</span>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-2xs text-ink-faint">Travel month</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="field py-2 text-sm">
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-3">
            <span className="mb-1.5 block text-2xs text-ink-faint">What do you love?</span>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  onClick={() => setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))}
                  className={cn('chip text-2xs', interests.includes(i) && 'chip-active')}
                >
                  {INTEREST_LABELS[i]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {matches ? (
          <div className="border-t border-line bg-parchment/40 p-5">
            <p className="label-caps mb-3">Best matches for your brief</p>
            <div className="grid gap-2.5 md:grid-cols-3">
              {matches.map((m) => (
                <Link
                  key={m.city.id}
                  href={`/explore/${m.city.id}`}
                  className="group rounded-xl border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-ink">{m.city.name}</p>
                      <p className="text-2xs text-ink-faint">{m.city.country}</p>
                    </div>
                    <span className="rounded-full bg-pine-600 px-2 py-0.5 text-2xs font-semibold text-white">{m.score}</span>
                  </div>
                  <p className="mt-2 text-2xs text-ink-mute">≈ {inr(m.estimatedTotalPerPerson)} per person</p>
                  <ul className="mt-2 space-y-1">
                    {m.reasons.slice(0, 2).map((r) => (
                      <li key={r} className="text-[11px] leading-snug text-ink-soft">
                        · {r}
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map((r) => (
            <button key={r} onClick={() => setRegion(r)} className={cn('chip text-2xs', region === r && 'chip-active')}>
              {r === 'any' ? 'All regions' : REGION_LABEL[r]}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-mute">{filtered.length} destinations</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((city) => (
          <Link key={city.id} href={`/explore/${city.id}`} className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className="relative aspect-[4/3] overflow-hidden">
              <SafeImage
                src={city.heroImage}
                alt={city.name}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 380px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
              <div className="absolute inset-x-3 bottom-3">
                <p className="text-2xs uppercase tracking-[0.14em] text-white/70">{city.country}</p>
                <p className="font-display text-xl text-white">{city.name}</p>
              </div>
              <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-2xs font-medium text-ink backdrop-blur">
                {city.pois.length} experiences
              </span>
            </div>
            <div className="p-4">
              <p className="line-clamp-2 text-xs leading-relaxed text-ink-mute">{city.tagline}</p>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-2xs">
                <span className="text-ink-faint">
                  Best {city.bestMonths.slice(0, 3).map((m) => new Date(2026, m - 1).toLocaleDateString('en-IN', { month: 'short' })).join(' · ')}
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-clay-600">
                  Explore <ArrowRight size={11} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/60 py-16 text-center">
          <Compass size={20} className="mx-auto text-ink-faint" />
          <p className="mt-3 font-display text-xl text-ink">No destinations match that combination</p>
          <p className="mt-1 text-sm text-ink-mute">Try clearing an interest or switching region.</p>
        </div>
      ) : null}
    </div>
  );
}
