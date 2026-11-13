'use client';

import { Plane, Luggage, Clock, Check, ArrowRight, Leaf } from 'lucide-react';
import { airlineByCode } from '@/lib/data/airlines';
import { airportByCode } from '@/lib/data/airports';
import type { Flight } from '@/lib/types';
import { cn, durationLabel, fmtTime, inr } from '@/lib/utils';
import { ProvenanceBadge } from '@/components/ui';
import { useState } from 'react';

const TAG_STYLE: Record<string, string> = {
  cheapest: 'bg-pine-600 text-white',
  fastest: 'bg-clay-500 text-white',
  recommended: 'bg-ink text-ivory',
  'best-value': 'bg-gold-400/20 text-gold-600 border border-gold-400/40',
};

const TAG_LABEL: Record<string, string> = {
  cheapest: 'Cheapest',
  fastest: 'Fastest',
  recommended: 'AI pick',
  'best-value': 'Best value',
};

export function AirlineMark({ code, size = 36 }: { code: string; size?: number }) {
  const airline = airlineByCode(code);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl text-[11px] font-bold tracking-wide text-white"
      style={{ width: size, height: size, backgroundColor: airline?.color ?? '#3B3730' }}
      title={airline?.name ?? code}
    >
      {code}
    </span>
  );
}

export function FlightCard({
  flight,
  selected,
  onSelect,
  compact,
  actionLabel = 'Select fare',
}: {
  flight: Flight;
  selected?: boolean;
  onSelect?: (f: Flight) => void;
  compact?: boolean;
  actionLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const from = airportByCode(flight.from);
  const to = airportByCode(flight.to);
  const stopsLabel = flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`;

  return (
    <div
      className={cn(
        '@container group relative overflow-hidden rounded-2xl border bg-white transition-all',
        selected ? 'border-ink shadow-card ring-1 ring-ink/5' : 'border-line hover:border-line-strong hover:shadow-card'
      )}
    >
      <div className="flex flex-col gap-4 p-4 @[36rem]:flex-row @[36rem]:items-center @[36rem]:gap-5 sm:p-5">
        <div className="flex items-center gap-3 @[36rem]:w-[188px] @[36rem]:shrink-0">
          <AirlineMark code={flight.carrier} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">{flight.carrierName}</p>
            <p className="text-2xs text-ink-faint">
              {flight.segments[0]?.flightNo ?? flight.carrier} · {flight.cabin}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="text-left">
            <p className="font-display text-[22px] leading-none text-ink">{fmtTime(flight.departAt)}</p>
            <p className="mt-1 text-2xs text-ink-mute">
              {flight.from} · {from?.city}
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center px-1">
            <span className="text-2xs text-ink-faint">{durationLabel(flight.durationMin)}</span>
            <div className="relative my-1 h-px w-full bg-line">
              <span className="absolute -top-[3px] left-0 h-[7px] w-[7px] rounded-full border border-line-strong bg-white" />
              <span className="absolute -top-[3px] right-0 h-[7px] w-[7px] rounded-full border border-line-strong bg-white" />
              <Plane size={11} className="absolute -top-[5px] left-1/2 -translate-x-1/2 bg-white text-ink-faint" />
            </div>
            <span className={cn('text-2xs font-medium', flight.stops === 0 ? 'text-pine-600' : 'text-ink-mute')}>{stopsLabel}</span>
          </div>
          <div className="text-right">
            <p className="font-display text-[22px] leading-none text-ink">{fmtTime(flight.arriveAt)}</p>
            <p className="mt-1 text-2xs text-ink-mute">
              {flight.to} · {to?.city}
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-line pt-3 @[36rem]:w-[150px] @[36rem]:shrink-0 @[36rem]:flex-col @[36rem]:items-end @[36rem]:border-l @[36rem]:border-t-0 @[36rem]:pl-4 @[36rem]:pt-0">
          <div className="text-right">
            <p className="font-display text-[22px] leading-none text-ink">{inr(flight.price)}</p>
            <p className="mt-1 text-2xs text-ink-faint">per traveller</p>
          </div>
          {onSelect ? (
            <button
              onClick={() => onSelect(flight)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                selected ? 'bg-ink text-ivory' : 'border border-line text-ink-soft hover:border-ink hover:text-ink'
              )}
            >
              {selected ? <Check size={12} /> : null}
              {selected ? 'Selected' : actionLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-parchment/50 px-4 py-2 sm:px-5">
        {flight.tags.map((t) => (
          <span key={t} className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', TAG_STYLE[t])}>
            {TAG_LABEL[t]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-2xs text-ink-mute">
          <Luggage size={11} /> {flight.baggage.checked} check-in · {flight.baggage.cabin} cabin
        </span>
        {flight.layovers.length ? (
          <span className="inline-flex items-center gap-1 text-2xs text-ink-mute">
            <Clock size={11} /> {flight.layovers.map((l) => `${l.airport} ${durationLabel(l.minutes)}`).join(' · ')}
          </span>
        ) : null}
        {flight.carbonKg ? (
          <span className="hidden items-center gap-1 text-2xs text-ink-faint sm:inline-flex">
            <Leaf size={10} /> {flight.carbonKg} kg CO₂
          </span>
        ) : null}
        {flight.seatsLeft ? <span className="text-2xs text-clay-600">{flight.seatsLeft} seats left</span> : null}
        <div className="ml-auto flex items-center gap-2">
          <ProvenanceBadge kind={flight.source} compact />
          <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 text-2xs font-medium text-ink-mute hover:text-ink">
            {open ? 'Hide' : 'Details'} <ArrowRight size={10} className={cn('transition', open && 'rotate-90')} />
          </button>
        </div>
      </div>

      {open && !compact ? (
        <div className="border-t border-line bg-white px-4 py-3 sm:px-5">
          <p className="label-caps mb-2">Itinerary</p>
          <ol className="space-y-2">
            {flight.segments.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-ink-soft">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-400" />
                <span>
                  <span className="font-medium text-ink">
                    {s.from} → {s.to}
                  </span>{' '}
                  · {s.flightNo} · {fmtTime(s.departAt)}–{fmtTime(s.arriveAt)} ({durationLabel(s.durationMin)})
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ink-faint">
            <span>{flight.refundable ? 'Refundable fare' : 'Non-refundable fare'}</span>
            <span>Cabin: {flight.cabin}</span>
            <a
              href={flight.bookingUrl ?? '#'}
              onClick={(e) => {
                if (!flight.bookingUrl) e.preventDefault();
              }}
              className="font-medium text-clay-600 hover:underline"
            >
              {flight.source === 'live' ? 'View deal on provider' : 'Demo fare — no live booking'}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
