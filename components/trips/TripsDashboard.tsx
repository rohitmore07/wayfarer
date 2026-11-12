'use client';

import { SafeImage } from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Compass, Heart, MapPinned, Plane, Plus, Ticket, Users, Wallet, FileText } from 'lucide-react';
import type { Trip, User } from '@/lib/types';
import { CITIES } from '@/lib/data/cities';
import { HOTELS } from '@/lib/data/hotels';
import { ALL_POIS } from '@/lib/data/cities';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { HotelCard } from '@/components/cards/HotelCard';
import { Badge, EmptyState } from '@/components/ui';
import { cn, fmtDate, inr } from '@/lib/utils';

type Tab = 'upcoming' | 'past' | 'saved' | 'documents';

export function TripsDashboard({ trips, user }: { trips: Trip[]; user: User }) {
  const [tab, setTab] = useState<Tab>('upcoming');

  const upcoming = useMemo(() => trips.filter((t) => new Date(t.startDate) >= new Date() || t.status === 'upcoming'), [trips]);
  const past = useMemo(() => trips.filter((t) => !upcoming.includes(t)), [trips, upcoming]);

  const savedDestinations = CITIES.filter((c) => user.savedDestinations.includes(c.id));
  const savedHotels = HOTELS.filter((h) => user.savedHotels.includes(h.id));
  const savedActivities = ALL_POIS.filter((p) => user.savedActivities.includes(p.id));

  const conversations = trips
    .flatMap((t) => t.messages.map((m) => ({ ...m, tripId: t.id, tripTitle: t.title })))
    .filter((m) => m.role === 'assistant')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const counts: Record<Tab, number> = {
    upcoming: upcoming.length,
    past: past.length,
    saved: savedDestinations.length + savedHotels.length + savedActivities.length,
    documents: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-full border border-line bg-white p-1">
          {([
            ['upcoming', 'Upcoming'],
            ['past', 'Past trips'],
            ['saved', 'Saved'],
            ['documents', 'Documents'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                tab === id ? 'bg-ink text-ivory' : 'text-ink-mute hover:text-ink'
              )}
            >
              {label}
              {counts[id] ? <span className={cn('ml-1.5 text-2xs', tab === id ? 'text-clay-200' : 'text-ink-faint')}>{counts[id]}</span> : null}
            </button>
          ))}
        </div>
        <Link href="/plan" className="btn-primary text-xs">
          <Plus size={13} /> Plan a new trip
        </Link>
      </div>

      {tab === 'upcoming' || tab === 'past' ? (
        (tab === 'upcoming' ? upcoming : past).length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(tab === 'upcoming' ? upcoming : past).map((trip) => (
              <TripCard key={trip.id} trip={trip} past={tab === 'past'} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MapPinned}
            title={tab === 'upcoming' ? 'No trips planned yet' : 'No past trips'}
            description={
              tab === 'upcoming'
                ? 'Describe the trip you have in mind and the agent will build the whole thing — flights, stays, days and budget.'
                : 'Trips move here once their start date has passed.'
            }
            action={
              <Link href="/plan" className="btn-primary text-xs">
                Start planning
              </Link>
            }
          />
        )
      ) : null}

      {tab === 'saved' ? (
        <div className="space-y-8">
          <section>
            <p className="label-caps mb-3 flex items-center gap-1.5">
              <Compass size={11} /> Saved destinations
            </p>
            {savedDestinations.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {savedDestinations.map((c) => (
                  <Link key={c.id} href={`/explore/${c.id}`} className="group overflow-hidden rounded-xl border border-line bg-white transition hover:shadow-card">
                    <div className="relative aspect-[16/10]">
                      <SafeImage src={c.heroImage} alt={c.name} fill className="object-cover transition group-hover:scale-105" sizes="260px" />
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-[13px] font-medium text-ink">{c.name}</p>
                      <p className="text-2xs text-ink-faint">{c.country}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-mute">Nothing saved yet — tap the heart on any destination or activity.</p>
            )}
          </section>

          <section>
            <p className="label-caps mb-3 flex items-center gap-1.5">
              <Heart size={11} /> Favourite stays
            </p>
            {savedHotels.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {savedHotels.map((h) => (
                  <HotelCard key={h.id} hotel={h} nights={3} reasons={[]} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-mute">No favourite hotels yet.</p>
            )}
          </section>

          <section>
            <p className="label-caps mb-3 flex items-center gap-1.5">
              <Ticket size={11} /> Saved experiences
            </p>
            {savedActivities.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {savedActivities.map((p) => (
                  <ActivityCard key={p.id} poi={p} cityName={CITIES.find((c) => c.id === p.cityId)?.name} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-mute">No saved experiences yet.</p>
            )}
          </section>

          {conversations.length ? (
            <section>
              <p className="label-caps mb-3">Recent agent conversations</p>
              <div className="space-y-2">
                {conversations.map((m) => (
                  <Link key={m.id} href={`/trips/${m.tripId}`} className="block rounded-xl border border-line bg-white p-3.5 transition hover:shadow-card">
                    <p className="text-2xs text-ink-faint">{m.tripTitle}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">{m.content}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === 'documents' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="label-caps flex items-center gap-1.5">
              <FileText size={11} /> Travel documents
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-mute">
              Keep visa letters, insurance policies and booking references together. Documents are stored per account
              and are only visible to you.
            </p>
            <div className="mt-4 space-y-2">
              {['Passport scan', 'Travel insurance', 'Visa approval'].map((d) => (
                <div key={d} className="flex items-center justify-between rounded-xl border border-dashed border-line px-3 py-2.5">
                  <span className="text-xs text-ink-soft">{d}</span>
                  <span className="text-2xs text-ink-faint">Not uploaded</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-2xs text-ink-faint">
              Uploads are disabled in this demo — the data model supports them (see prisma/schema.prisma).
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="label-caps">Booking references</p>
            {trips.flatMap((t) => t.bookingRefs.map((b) => ({ ...b, tripId: t.id }))).length ? (
              <ul className="mt-3 space-y-2">
                {trips.flatMap((t) =>
                  t.bookingRefs.map((b) => (
                    <li key={`${t.id}-${b.ref}`} className="flex items-center justify-between rounded-xl bg-parchment px-3 py-2 text-xs">
                      <span className="text-ink-soft">{b.label}</span>
                      <span className="font-mono text-ink">{b.ref}</span>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-ink-mute">
                No booking references yet. Wayfarer never generates a confirmation number itself — references only
                appear when a booking provider confirms them.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TripCard({ trip, past }: { trip: Trip; past?: boolean }) {
  const rawUsed = (trip.budget.estimatedTotal / Math.max(1, trip.budget.totalBudget)) * 100;
  const used = Math.min(100, rawUsed);
  const over = rawUsed > 100;
  return (
    <Link href={`/trips/${trip.id}`} className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[16/9] overflow-hidden">
        <SafeImage src={trip.coverImage} alt={trip.title} fill className="object-cover transition duration-700 group-hover:scale-[1.03]" sizes="400px" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/5" />
        <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between">
          <div>
            <p className="font-display text-xl text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">{trip.title}</p>
            <p className="text-2xs text-white/75">
              {fmtDate(trip.startDate, { day: 'numeric', month: 'short' })} – {fmtDate(trip.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <Badge className="border-white/20 bg-white/15 text-white backdrop-blur">{past ? 'Completed' : `${trip.brief.days} days`}</Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-mute">
          <span className="inline-flex items-center gap-1"><Users size={10} /> {trip.travelers}</span>
          <span className="inline-flex items-center gap-1"><MapPinned size={10} /> {trip.cities.length} cities</span>
          <span className="inline-flex items-center gap-1"><Plane size={10} /> {trip.itinerary.reduce((s, d) => s + d.activities.length, 0)} stops</span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-2xs">
            <span className="inline-flex items-center gap-1 text-ink-mute"><Wallet size={10} /> {inr(trip.budget.estimatedTotal, { compact: true })}</span>
            <span className={cn('inline-flex items-center gap-1', over ? 'font-medium text-clay-600' : 'text-ink-faint')}>
              {Math.round(rawUsed)}% of {inr(trip.budget.totalBudget, { compact: true })}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sand">
            <div
              className={cn('h-full rounded-full transition-all', rawUsed > 100 ? 'bg-clay-500' : rawUsed > 90 ? 'bg-gold-500' : 'bg-pine-600')}
              style={{ width: `${used}%` }}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
          <span className="inline-flex items-center gap-1 text-2xs text-ink-faint">
            <CalendarDays size={10} /> Updated {new Date(trip.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <span className="inline-flex items-center gap-1 text-2xs font-medium text-clay-600">
            Open workspace <ArrowRight size={11} className="transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
