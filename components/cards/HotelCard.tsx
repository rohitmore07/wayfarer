'use client';

import { SafeImage } from '@/components/ui/SafeImage';
import { useState } from 'react';
import { BedDouble, Check, MapPin, Heart, Coffee, Wifi, Waves, Dumbbell } from 'lucide-react';
import type { Hotel } from '@/lib/types';
import { cn, inr } from '@/lib/utils';
import { ProvenanceBadge, Stars } from '@/components/ui';

const AMENITY_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Free Wi-Fi': Wifi,
  Breakfast: Coffee,
  Pool: Waves,
  Gym: Dumbbell,
};

export function HotelCard({
  hotel,
  nights = 1,
  rooms = 1,
  selected,
  onSelect,
  reasons,
  score,
  compact,
}: {
  hotel: Hotel;
  nights?: number;
  rooms?: number;
  selected?: boolean;
  onSelect?: (h: Hotel) => void;
  reasons?: string[];
  score?: number;
  compact?: boolean;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const total = hotel.pricePerNight * nights * rooms;

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-2xl border bg-white transition-all',
        selected ? 'border-ink shadow-card ring-1 ring-ink/5' : 'border-line hover:border-line-strong hover:shadow-card'
      )}
    >
      <div className={cn('flex flex-col', compact ? '' : 'sm:flex-row')}>
        <div className={cn('relative shrink-0 overflow-hidden', compact ? 'aspect-[16/9]' : 'aspect-[16/10] sm:aspect-auto sm:w-[240px]')}>
          <SafeImage
            src={hotel.images[imgIdx] ?? hotel.images[0]}
            alt={hotel.name}
            fill
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, 240px"
          />
          <div className="absolute inset-x-2 top-2 flex justify-between">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-2xs font-medium text-ink backdrop-blur">
              {hotel.propertyType === 'ryokan' ? 'Ryokan' : hotel.propertyType}
            </span>
            <button
              onClick={() => setSaved((v) => !v)}
              aria-label="Save hotel"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-mute backdrop-blur transition hover:text-clay-600"
            >
              <Heart size={13} className={saved ? 'fill-clay-500 text-clay-500' : ''} />
            </button>
          </div>
          {hotel.images.length > 1 ? (
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
              {hotel.images.slice(0, 3).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={cn('h-1.5 w-4 rounded-full transition', imgIdx === i ? 'bg-white' : 'bg-white/40')}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Stars n={hotel.stars} />
                <span className="text-2xs text-ink-faint">· {hotel.area}</span>
              </div>
              <h3 className="mt-0.5 truncate text-[15px] font-medium text-ink">{hotel.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-2xs text-ink-mute">
                <MapPin size={10} /> {hotel.nearby[0]?.name} · {hotel.nearby[0]?.km} km to centre
              </p>
            </div>
            <div className="shrink-0 rounded-lg bg-pine-600 px-1.5 py-1 text-center text-white">
              <p className="text-xs font-semibold leading-none">{hotel.rating.toFixed(1)}</p>
              <p className="mt-0.5 text-[8px] uppercase tracking-wide opacity-80">
                {hotel.rating >= 9 ? 'Exceptional' : hotel.rating >= 8.5 ? 'Excellent' : 'Very good'}
              </p>
            </div>
          </div>

          {!compact ? (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-mute">{hotel.description}</p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 4).map((a) => {
              const Icon = AMENITY_ICON[a];
              return (
                <span key={a} className="inline-flex items-center gap-1 rounded-md border border-line bg-parchment px-1.5 py-0.5 text-2xs text-ink-mute">
                  {Icon ? <Icon size={10} /> : null}
                  {a}
                </span>
              );
            })}
          </div>

          {reasons?.length ? (
            <ul className="mt-2.5 space-y-1">
              {reasons.slice(0, 2).map((r) => (
                <li key={r} className="flex items-start gap-1.5 text-2xs text-pine-600">
                  <Check size={10} className="mt-0.5 shrink-0" strokeWidth={3} />
                  {r}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div>
              <p className="font-display text-[20px] leading-none text-ink">
                {inr(hotel.pricePerNight)}
                <span className="ml-1 font-sans text-2xs font-normal text-ink-faint">/night</span>
              </p>
              <p className="mt-1 text-2xs text-ink-faint">
                {inr(total)} for {nights} night{nights > 1 ? 's' : ''}
                {rooms > 1 ? ` · ${rooms} rooms` : ''}
              </p>
            </div>
            {onSelect ? (
              <button
                onClick={() => onSelect(hotel)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                  selected ? 'bg-ink text-ivory' : 'border border-line text-ink-soft hover:border-ink hover:text-ink'
                )}
              >
                {selected ? <Check size={12} /> : <BedDouble size={12} />}
                {selected ? 'Selected' : 'Choose'}
              </button>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="text-2xs text-ink-faint">{hotel.cancellation.split('.')[0]}.</span>
            <ProvenanceBadge kind={hotel.source} compact />
          </div>
        </div>
      </div>
      {score !== undefined ? (
        <div className="border-t border-line bg-parchment/60 px-4 py-2 text-2xs text-ink-mute">
          Match score <span className="font-semibold text-ink">{score}</span> · ranked against your brief
        </div>
      ) : null}
    </article>
  );
}
