'use client';

import { SafeImage } from '@/components/ui/SafeImage';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CalendarDays,
  CircleDollarSign,
  Download,
  Info,
  MapPinned,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
  BedDouble,
  Backpack,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import type { Flight, Hotel, ItineraryDay, Trip } from '@/lib/types';
import { cityById } from '@/lib/data/cities';
import { cn, fmtDate, inr } from '@/lib/utils';
import { Badge, Button, ProvenanceBadge } from '@/components/ui';
import { FlightCard } from '@/components/cards/FlightCard';
import { HotelCard } from '@/components/cards/HotelCard';
import { ItineraryPanel } from './ItineraryPanel';
import { BudgetPanel } from './BudgetPanel';
import { TripMap, pointsFromActivities } from './TripMap';
import { buildPackingList, safetyBriefing } from '@/lib/extras';
import { regenerateDay } from '@/lib/agent/itinerary';
import { recalcTripBudget } from '@/lib/trips';

export type Tab = 'overview' | 'itinerary' | 'flights' | 'stays' | 'budget' | 'prep' | 'map';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'itinerary', label: 'Itinerary', icon: CalendarDays },
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'stays', label: 'Stays', icon: BedDouble },
  { id: 'budget', label: 'Budget', icon: CircleDollarSign },
  { id: 'map', label: 'Map', icon: MapPinned },
  { id: 'prep', label: 'Prep & safety', icon: Backpack },
];

export function TripWorkspaceView({
  trip,
  onChange,
  headerActions,
  agentMode,
  onRefine,
}: {
  trip: Trip;
  onChange?: (trip: Trip) => void;
  headerActions?: React.ReactNode;
  agentMode?: boolean;
  onRefine?: (message: string) => Promise<void> | void;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [mapCity, setMapCity] = useState<string>('all');
  const mapCities = Array.from(new Set(trip.itinerary.map((d) => d.cityName)));
  const mapPoints = pointsFromActivities(
    mapCity === 'all' ? trip.itinerary : trip.itinerary.filter((d) => d.cityName === mapCity)
  );
  const [sort, setSort] = useState<'recommended' | 'price-asc' | 'duration'>('recommended');
  const [flightDirection, setFlightDirection] = useState<'out' | 'ret'>('out');

  const update = (patch: Partial<Trip>) => {
    if (!onChange) return;
    const next = { ...trip, ...patch, updatedAt: new Date().toISOString() };
    onChange(recalcTripBudget(next));
  };

  const nights = Math.max(1, trip.brief.days - 1);
  const rooms = Math.ceil(trip.travelers / 2);
  const under = trip.budget.totalBudget - trip.budget.estimatedTotal;

  const outbound = useMemo(() => {
    const list = [...trip.flights];
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'duration') list.sort((a, b) => a.durationMin - b.durationMin);
    else list.sort((a, b) => Number(b.tags.includes('recommended')) - Number(a.tags.includes('recommended')) || a.price - b.price);
    return list;
  }, [trip.flights, sort]);

  const selectedHotel = (cityId: string): Hotel | undefined =>
    trip.hotels.find((h) => h.id === trip.hotelSelections?.[cityId]) ?? trip.hotels.find((h) => h.cityId === cityId);

  const handleItineraryChange = (days: ItineraryDay[]) => update({ itinerary: days });

  const handleRegenerateDay = (day: number) => {
    const rebuilt = regenerateDay(trip.brief, trip.itinerary, day, {});
    update({ itinerary: rebuilt });
  };

  return (
    <div className="min-h-screen">
      {/* Cover */}
      <div className="relative h-[220px] w-full overflow-hidden border-b border-line sm:h-[280px]">
        {trip.coverImage ? (
          <SafeImage src={trip.coverImage} alt={trip.title} fill priority className="object-cover" sizes="100vw" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/10" />
        <div className="container-page relative flex h-full flex-col justify-end pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-2xs font-medium uppercase tracking-[0.12em] text-white/90 backdrop-blur">
                  {trip.status === 'past' ? 'Past trip' : 'Upcoming trip'}
                </span>
                {trip.isSample ? <span className="rounded-full bg-white/15 px-2.5 py-1 text-2xs text-white/80">Sample</span> : null}
              </div>
              <h1 className="mt-2 font-display text-[32px] leading-tight text-white sm:text-[40px]">{trip.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={12} /> {fmtDate(trip.startDate, { day: 'numeric', month: 'short' })} –{' '}
                  {fmtDate(trip.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} /> {trip.travelers} travellers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPinned size={12} /> {trip.cities.map((c) => c.name).join(' · ')}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {headerActions}
              <button className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/10">
                <Share2 size={13} /> Share
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-ink transition hover:bg-white/90">
                <Download size={13} /> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 border-b border-line bg-ivory/95 backdrop-blur">
        <div className="container-page no-scrollbar flex gap-1 overflow-x-auto py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition',
                tab === t.id ? 'bg-ink text-ivory' : 'text-ink-mute hover:bg-sand hover:text-ink'
              )}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container-page py-6">
        {/* ------------------------------ OVERVIEW ------------------------------ */}
        {tab === 'overview' ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Total estimate', inr(trip.budget.estimatedTotal, { compact: true }), `${inr(trip.budget.perPerson, { compact: true })} pp`],
                  ['Per day', inr(trip.budget.daily ?? 0, { compact: true }), `${nights} nights`],
                  ['Stops mapped', String(trip.itinerary.reduce((s, d) => s + d.activities.length, 0)), `${trip.itinerary.length} days`],
                  [under >= 0 ? 'Under budget' : 'Over budget', inr(Math.abs(under), { compact: true }), `${Math.round((trip.budget.estimatedTotal / Math.max(1, trip.budget.totalBudget)) * 100)}% used`],
                ].map(([label, value, hint]) => (
                  <div key={label} className="rounded-xl border border-line bg-white p-3.5">
                    <p className="label-caps">{label}</p>
                    <p className={cn('mt-1 font-display text-[22px] leading-none', label === 'Over budget' ? 'text-clay-600' : 'text-ink')}>{value}</p>
                    <p className="mt-1 text-2xs text-ink-faint">{hint}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl text-ink">Trip shape</h2>
                  <Badge tone="pine">
                    <Sparkles size={10} /> AI plan
                  </Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  {trip.cities.map((c, i) => (
                    <div key={c.cityId} className="flex-1">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: ['#C05B34', '#1F4A43', '#C99A4B', '#3F6E8C'][i % 4] }}
                      />
                      <p className="mt-2 text-xs font-medium text-ink">{c.name}</p>
                      <p className="text-2xs text-ink-faint">{c.nights} nights</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-2">
                  {trip.itinerary.slice(0, 4).map((d) => (
                    <button
                      key={d.day}
                      onClick={() => setTab('itinerary')}
                      className="flex w-full items-center gap-3 rounded-xl border border-line/80 px-3 py-2.5 text-left transition hover:border-line-strong hover:bg-parchment/60"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sand font-display text-sm text-ink">{d.day}</span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-[13px] leading-snug text-ink">{d.title}</span>
                        <span className="text-2xs text-ink-faint">
                          {fmtDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {d.activities.length} stops
                        </span>
                      </span>
                      <span className="text-2xs text-ink-mute">{inr(d.dailyCostINR)}</span>
                      <ArrowRight size={13} className="text-ink-faint" />
                    </button>
                  ))}
                </div>
              </div>

              {trip.messages.length ? (
                <div className="rounded-2xl border border-line bg-white p-5">
                  <h2 className="font-display text-xl text-ink">Recent agent changes</h2>
                  <ul className="mt-3 space-y-2">
                    {trip.messages
                      .filter((m) => m.role === 'assistant')
                      .slice(-3)
                      .reverse()
                      .map((m) => (
                        <li key={m.id} className="rounded-xl bg-parchment px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
                          {m.content}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              {onRefine && agentMode ? (
                <QuickRefine onRefine={onRefine} />
              ) : null}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="label-caps">Budget</p>
                  <ProvenanceBadge kind="estimated" />
                </div>
                <p className="mt-2 font-display text-[28px] leading-none text-ink">{inr(trip.budget.estimatedTotal)}</p>
                <p className="mt-1 text-xs text-ink-mute">
                  {inr(trip.budget.perPerson)} per person · target {inr(trip.budget.totalBudget)}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sand">
                  <div
                    className={cn('h-full rounded-full', under >= 0 ? 'bg-pine-600' : 'bg-clay-500')}
                    style={{ width: `${Math.min(100, (trip.budget.estimatedTotal / Math.max(1, trip.budget.totalBudget)) * 100)}%` }}
                  />
                </div>
                <ul className="mt-4 space-y-1.5">
                  {trip.budget.categories.slice(0, 5).map((c) => (
                    <li key={c.key} className="flex items-center justify-between text-xs">
                      <span className="text-ink-mute">{c.label}</span>
                      <span className="text-ink">{inr(c.total)}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => setTab('budget')} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-clay-600 hover:underline">
                  Open budget planner <ArrowRight size={11} />
                </button>
              </div>

              {selectedFlight(trip) ? (
                <div className="rounded-2xl border border-line bg-white p-4">
                  <p className="label-caps mb-2">Outbound flight</p>
                  <FlightCard flight={selectedFlight(trip)!} compact />
                  <button onClick={() => setTab('flights')} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-clay-600 hover:underline">
                    Compare {trip.flights.length} options <ArrowRight size={11} />
                  </button>
                </div>
              ) : null}

              {selectedHotel(trip.cities[0].cityId) ? (
                <div className="rounded-2xl border border-line bg-white p-4">
                  <p className="label-caps mb-2">Stay in {trip.cities[0].name}</p>
                  <HotelCard hotel={selectedHotel(trip.cities[0].cityId)!} nights={trip.cities[0].nights} rooms={rooms} compact />
                </div>
              ) : null}

              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="label-caps">Data provenance</p>
                <ul className="mt-2.5 space-y-2">
                  {trip.sources.map((s) => (
                    <li key={s.label} className="flex items-start gap-2">
                      <ProvenanceBadge kind={s.provenance} compact />
                      <span className="text-2xs leading-relaxed text-ink-mute">
                        <span className="font-medium text-ink">{s.label}.</span> {s.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {/* ------------------------------ ITINERARY ----------------------------- */}
        {tab === 'itinerary' ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ItineraryPanel
              itinerary={trip.itinerary}
              editable
              onChange={handleItineraryChange}
              onRegenerateDay={handleRegenerateDay}
              onRemoveActivity={(day, activityId) =>
                update({
                  itinerary: trip.itinerary.map((d) =>
                    d.day === day ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) } : d
                  ),
                })
              }
            />
            <aside className="space-y-4">
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="label-caps">Trip at a glance</p>
                <div className="mt-3 space-y-3">
                  {trip.cities.map((c) => {
                    const hotel = selectedHotel(c.cityId);
                    return (
                      <div key={c.cityId} className="rounded-xl border border-line/80 p-3">
                        <p className="text-[13px] font-medium text-ink">{c.name}</p>
                        <p className="text-2xs text-ink-faint">{c.nights} nights</p>
                        {hotel ? (
                          <p className="mt-1.5 text-2xs leading-relaxed text-ink-mute">
                            {hotel.name} · {hotel.rating}/10 · {inr(hotel.pricePerNight)}/night
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
              {onRefine && agentMode ? <QuickRefine onRefine={onRefine} /> : null}
            </aside>
          </div>
        ) : null}

        {/* ------------------------------- FLIGHTS ------------------------------ */}
        {tab === 'flights' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-full border border-line bg-white p-1">
                <button
                  onClick={() => setFlightDirection('out')}
                  className={cn('rounded-full px-3 py-1.5 text-xs font-medium', flightDirection === 'out' ? 'bg-ink text-ivory' : 'text-ink-mute')}
                >
                  Outbound · {trip.flights[0]?.from} → {trip.flights[0]?.to}
                </button>
                {trip.returnFlight ? (
                  <button
                    onClick={() => setFlightDirection('ret')}
                    className={cn('rounded-full px-3 py-1.5 text-xs font-medium', flightDirection === 'ret' ? 'bg-ink text-ivory' : 'text-ink-mute')}
                  >
                    Return · {trip.returnFlight.from} → {trip.returnFlight.to}
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5">
                {(['recommended', 'price-asc', 'duration'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={cn('rounded-full border px-3 py-1.5 text-2xs font-medium', sort === s ? 'border-ink bg-white text-ink' : 'border-line bg-white text-ink-mute')}
                  >
                    {s === 'recommended' ? 'AI recommended' : s === 'price-asc' ? 'Cheapest' : 'Fastest'}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-parchment/70 px-4 py-2.5 text-2xs text-ink-mute">
              <Info size={11} className="mr-1 inline" />
              {trip.flights[0]?.source === 'live'
                ? 'Live inventory. Prices and availability come straight from the provider.'
                : 'Demo fares from the Wayfarer sandbox engine — connect an Amadeus key to show live, bookable fares. Nothing here is a confirmed booking.'}
            </div>

            <div className="space-y-2.5">
              {flightDirection === 'out'
                ? outbound.map((f) => (
                    <FlightCard
                      key={f.id}
                      flight={f}
                      selected={trip.selectedFlightId === f.id}
                      onSelect={(flight) => update({ selectedFlightId: flight.id })}
                    />
                  ))
                : trip.returnFlight
                  ? <FlightCard flight={trip.returnFlight} selected />
                  : null}
            </div>
          </div>
        ) : null}

        {/* -------------------------------- STAYS ------------------------------- */}
        {tab === 'stays' ? (
          <div className="space-y-6">
            {trip.cities.map((c) => {
              const city = cityById(c.cityId);
              const options = trip.hotels.filter((h) => h.cityId === c.cityId);
              return (
                <section key={c.cityId}>
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h2 className="font-display text-xl text-ink">Stays in {c.name}</h2>
                      <p className="text-xs text-ink-mute">
                        {c.nights} nights · {rooms} room{rooms > 1 ? 's' : ''} · ranked by proximity to your itinerary
                      </p>
                    </div>
                    {city ? <Badge tone="neutral">{options.length} shortlisted</Badge> : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {options.map((h) => (
                      <HotelCard
                        key={h.id}
                        hotel={h}
                        nights={c.nights}
                        rooms={rooms}
                        selected={trip.hotelSelections?.[c.cityId] === h.id}
                        onSelect={(hotel) =>
                          update({ hotelSelections: { ...(trip.hotelSelections ?? {}), [c.cityId]: hotel.id } })
                        }
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}

        {/* -------------------------------- BUDGET ------------------------------ */}
        {tab === 'budget' ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <BudgetPanel plan={trip.budget} days={trip.brief.days} travelers={trip.travelers} />
            <aside className="space-y-4">
              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="label-caps">Expense detail</p>
                <table className="mt-3 w-full text-xs">
                  <thead>
                    <tr className="text-left text-2xs uppercase tracking-wide text-ink-faint">
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                      <th className="pb-2 text-right font-medium">Each</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {trip.budget.categories.map((c) => (
                      <tr key={c.key}>
                        <td className="py-2 text-ink-soft">
                          {c.label}
                          {c.note ? <span className="block text-2xs text-ink-faint">{c.note}</span> : null}
                        </td>
                        <td className="py-2 text-right text-ink">{inr(c.total)}</td>
                        <td className="py-2 text-right text-ink-mute">{inr(c.perPerson)}</td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td className="py-2 text-ink">Total</td>
                      <td className="py-2 text-right text-ink">{inr(trip.budget.estimatedTotal)}</td>
                      <td className="py-2 text-right text-ink">{inr(trip.budget.perPerson)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {onRefine && agentMode ? <QuickRefine onRefine={onRefine} /> : null}
            </aside>
          </div>
        ) : null}

        {/* --------------------------------- MAP -------------------------------- */}
        {tab === 'map' ? (
          <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-2xs uppercase tracking-[0.14em] text-ink-faint">Show</span>
            {[{ id: 'all', label: 'All cities' }, ...mapCities.map((c) => ({ id: c, label: c }))].map((c) => (
              <button
                key={c.id}
                onClick={() => setMapCity(c.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-2xs font-medium transition',
                  mapCity === c.id
                    ? 'border-ink bg-ink text-ivory'
                    : 'border-line bg-white text-ink-mute hover:border-line-strong hover:text-ink'
                )}
              >
                {c.label}
              </button>
            ))}
            <span className="ml-auto text-2xs text-ink-faint">
              {mapPoints.length} mapped stops · dashed line = walking / transfer route
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <TripMap points={mapPoints} height={520} />
            <aside className="rounded-2xl border border-line bg-white p-4">
              <p className="label-caps">Route by day</p>
              <ul className="mt-3 space-y-2">
                {trip.itinerary.map((d, i) => (
                  <li key={d.day} className="flex items-start gap-2.5">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ['#C05B34', '#1F4A43', '#C99A4B', '#3F6E8C', '#8A3A20', '#2F5F57', '#A97E33'][i % 7] }}
                    />
                    <span>
                      <span className="block text-xs font-medium text-ink">
                        Day {d.day} · {d.cityName}
                      </span>
                      <span className="text-2xs text-ink-mute">{d.activities.map((a) => a.name.split(',')[0]).join(' → ')}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
          </>
        ) : null}

        {/* --------------------------------- PREP ------------------------------- */}
        {tab === 'prep' ? <PrepPanel trip={trip} /> : null}
      </div>
    </div>
  );
}

function selectedFlight(trip: Trip): Flight | undefined {
  return trip.flights.find((f) => f.id === trip.selectedFlightId) ?? trip.flights[0];
}

function QuickRefine({ onRefine }: { onRefine: (m: string) => Promise<void> | void }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const prompts = ['Make it cheaper', 'Add a day in Kyoto', 'No early mornings', 'More luxury hotels'];

  return (
    <div className="rounded-2xl border border-clay-200 bg-clay-50/50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-clay-700">
        <Sparkles size={12} /> Ask the agent to change something
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!value.trim()) return;
          setBusy(true);
          await onRefine(value.trim());
          setValue('');
          setBusy(false);
        }}
        className="mt-2.5 flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. swap the Kyoto hotel for a ryokan"
          className="field bg-white py-2 text-xs"
        />
        <Button type="submit" size="sm" variant="primary" loading={busy}>
          Send
        </Button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={async () => {
              setBusy(true);
              await onRefine(p);
              setBusy(false);
            }}
            className="rounded-full border border-clay-200 bg-white px-2.5 py-1 text-2xs text-clay-700 transition hover:border-clay-300"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function PrepPanel({ trip }: { trip: Trip }) {
  const packing = trip.packingList?.length ? trip.packingList : buildPackingList({ brief: trip.brief, itinerary: trip.itinerary });
  const safety = safetyBriefing({ brief: trip.brief });
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const total = packing.reduce((s, g) => s + g.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-ink">Packing list</h2>
            <p className="text-xs text-ink-mute">
              Generated for {trip.brief.days} days in {trip.cities.map((c) => c.name).join(', ')} · {done}/{total} packed
            </p>
          </div>
          <Backpack size={18} className="text-clay-500" />
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-sand">
          <div className="h-full rounded-full bg-pine-600 transition-all" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
        </div>
        <div className="mt-4 space-y-4">
          {packing.map((group) => (
            <div key={group.title}>
              <p className="label-caps">{group.title}</p>
              <ul className="mt-1.5 space-y-1">
                {group.items.map((item) => {
                  const key = `${group.title}-${item.label}`;
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-ink-soft transition hover:bg-parchment">
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border transition',
                            checked[key] ? 'border-pine-600 bg-pine-600 text-white' : 'border-line-strong bg-white'
                          )}
                        >
                          {checked[key] ? <Check size={10} strokeWidth={3} /> : null}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={Boolean(checked[key])}
                          onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))}
                        />
                        <span className={checked[key] ? 'text-ink-faint line-through' : ''}>{item.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {safety.map((s) => (
          <div key={s.city} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Safety in {s.city}</h2>
              <Badge tone={s.level === 'very safe' ? 'pine' : s.level === 'safe' ? 'gold' : 'clay'}>
                <ShieldCheck size={10} /> {s.level}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-mute">{s.summary}</p>
            <ul className="mt-3 space-y-1.5">
              {s.tips.map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                  <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-pine-600" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              {[
                ['Police', s.emergency.police],
                ['Ambulance', s.emergency.ambulance],
                ['Tourist line', s.emergency.tourist ?? '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-2xs text-ink-faint">{label}</p>
                  <p className="text-sm font-medium text-ink">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-parchment px-3 py-2 text-2xs leading-relaxed text-ink-mute">
              <span className="font-medium text-ink">Visa & entry: </span>
              {s.visaNote}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
