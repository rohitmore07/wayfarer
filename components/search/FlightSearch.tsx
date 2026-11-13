'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarDays, Plane, Search, SlidersHorizontal, Users, Info, Loader2 } from 'lucide-react';
import { AIRPORTS, INDIA_ORIGINS } from '@/lib/data/airports';
import { AIRLINES } from '@/lib/data/airlines';
import type { Flight } from '@/lib/types';
import { FlightCard } from '@/components/cards/FlightCard';
import { cn, inr, todayISO, addDays, durationLabel } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

type Result = { flights: Flight[]; returnFlights: Flight[]; source: string; note: string };

export function FlightSearch({ defaultDestination }: { defaultDestination?: string }) {
  const [tripType, setTripType] = useState<'round' | 'one'>('round');
  const [origin, setOrigin] = useState('BOM');
  const [destination, setDestination] = useState(defaultDestination ?? 'NRT');
  const [departDate, setDepartDate] = useState(addDays(todayISO(), 45));
  const [returnDate, setReturnDate] = useState(addDays(todayISO(), 52));
  const [travelers, setTravelers] = useState(2);
  const [cabin, setCabin] = useState<'economy' | 'premium' | 'business'>('economy');
  const [nonStopOnly, setNonStopOnly] = useState(false);
  const [airlineFilter, setAirlineFilter] = useState<string[]>([]);
  const [departWindow, setDepartWindow] = useState<'any' | 'morning' | 'afternoon' | 'evening'>('any');
  const [sort, setSort] = useState<'recommended' | 'price' | 'duration'>('recommended');
  const [dir, setDir] = useState<'out' | 'ret'>('out');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          departDate,
          returnDate: tripType === 'round' ? returnDate : '',
          travelers,
          cabin,
          nonStopOnly,
          airlines: airlineFilter,
          departWindow,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setResult(data);
      setDir('out');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carriers = useMemo(() => {
    const codes = new Set((result?.flights ?? []).map((f) => f.carrier));
    return AIRLINES.filter((a) => codes.has(a.code));
  }, [result]);

  const visible = useMemo(() => {
    const list = dir === 'out' ? result?.flights ?? [] : result?.returnFlights ?? [];
    const filtered = airlineFilter.length ? list.filter((f) => airlineFilter.includes(f.carrier)) : list;
    const sorted = [...filtered];
    if (sort === 'price') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'duration') sorted.sort((a, b) => a.durationMin - b.durationMin);
    else sorted.sort((a, b) => Number(b.tags.includes('recommended')) - Number(a.tags.includes('recommended')) || a.price - b.price);
    return sorted;
  }, [result, dir, sort, airlineFilter]);

  const cheapest = result?.flights.reduce((min, f) => Math.min(min, f.price), Infinity);

  return (
    <div className="space-y-5">
      {/* search panel */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line bg-parchment p-1">
            {(['round', 'one'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTripType(t)}
                className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', tripType === t ? 'bg-white text-ink shadow-sm' : 'text-ink-mute')}
              >
                {t === 'round' ? 'Round trip' : 'One way'}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-2xs text-ink-mute">
            <Users size={12} />
            <select value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} className="bg-transparent text-xs font-medium text-ink outline-none">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} traveller{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <span className="text-line-strong">|</span>
            <select value={cabin} onChange={(e) => setCabin(e.target.value as never)} className="bg-transparent text-xs font-medium text-ink outline-none">
              <option value="economy">Economy</option>
              <option value="premium">Premium economy</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">From</span>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="field py-2.5 text-sm">
              {INDIA_ORIGINS.map((code) => {
                const a = AIRPORTS.find((x) => x.code === code)!;
                return (
                  <option key={code} value={code}>
                    {a.city} ({code})
                  </option>
                );
              })}
              {AIRPORTS.filter((a) => !INDIA_ORIGINS.includes(a.code)).map((a) => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code})
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setOrigin(destination);
              setDestination(origin);
            }}
            className="mt-5 hidden h-9 w-9 items-center justify-center rounded-full border border-line text-ink-mute transition hover:text-ink md:flex"
            aria-label="Swap airports"
          >
            <ArrowLeftRight size={13} />
          </button>
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">To</span>
            <select value={destination} onChange={(e) => setDestination(e.target.value)} className="field py-2.5 text-sm">
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.city} ({a.code})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Depart</span>
            <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} className="field py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs text-ink-faint">Return</span>
            <input
              type="date"
              value={returnDate}
              min={departDate}
              disabled={tripType === 'one'}
              onChange={(e) => setReturnDate(e.target.value)}
              className="field py-2.5 text-sm disabled:opacity-40"
            />
          </label>
          <button onClick={search} className="btn-primary mt-5 h-[42px] px-5" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button
            onClick={() => setNonStopOnly((v) => !v)}
            className={cn('chip', nonStopOnly && 'chip-active')}
          >
            Non-stop only
          </button>
          <select
            value={departWindow}
            onChange={(e) => setDepartWindow(e.target.value as never)}
            className="chip bg-white"
          >
            <option value="any">Any departure time</option>
            <option value="morning">Morning (before 12)</option>
            <option value="afternoon">Afternoon (12–18)</option>
            <option value="evening">Evening (after 18)</option>
          </select>
          {carriers.map((c) => (
            <button
              key={c.code}
              onClick={() =>
                setAirlineFilter((prev) => (prev.includes(c.code) ? prev.filter((x) => x !== c.code) : [...prev, c.code]))
              }
              className={cn('chip', airlineFilter.includes(c.code) && 'chip-active')}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">{error}</div>
      ) : null}

      {/* results header */}
      {result ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {result.returnFlights.length ? (
                <div className="flex rounded-full border border-line bg-white p-1">
                  <button onClick={() => setDir('out')} className={cn('rounded-full px-3 py-1.5 text-xs font-medium', dir === 'out' ? 'bg-ink text-ivory' : 'text-ink-mute')}>
                    Outbound · {origin}→{destination}
                  </button>
                  <button onClick={() => setDir('ret')} className={cn('rounded-full px-3 py-1.5 text-xs font-medium', dir === 'ret' ? 'bg-ink text-ivory' : 'text-ink-mute')}>
                    Return · {destination}→{origin}
                  </button>
                </div>
              ) : null}
              <p className="text-xs text-ink-mute">
                {visible.length} options{cheapest && isFinite(cheapest) ? ` · from ${inr(cheapest)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={12} className="text-ink-faint" />
              {(['recommended', 'price', 'duration'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={cn('rounded-full border px-3 py-1.5 text-2xs font-medium', sort === s ? 'border-ink bg-white text-ink' : 'border-line bg-white text-ink-mute')}
                >
                  {s === 'recommended' ? 'AI pick' : s === 'price' ? 'Cheapest' : 'Fastest'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-line bg-parchment/70 px-4 py-2.5 text-2xs leading-relaxed text-ink-mute">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>
              {result.note} <span className="text-ink-faint">Nothing on this page is a confirmed booking.</span>
            </span>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[132px] animate-pulse rounded-2xl border border-line bg-white/60" />
              ))
            ) : visible.length ? (
              visible.map((f) => <FlightCard key={f.id} flight={f} />)
            ) : (
              <EmptyState
                icon={Plane}
                title="No flights match those filters"
                description="Try removing the non-stop filter or widening your departure window."
              />
            )}
          </div>
        </>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-ink-mute">
          <Loader2 size={16} className="mr-2 animate-spin" /> Searching fares…
        </div>
      ) : null}
    </div>
  );
}
