'use client';

import { SafeImage } from '@/components/ui/SafeImage';
import { useState } from 'react';
import { Clock, Heart, MapPin, Ticket, Sun, Umbrella } from 'lucide-react';
import type { Poi } from '@/lib/types';
import { cn, durationLabel, inr } from '@/lib/utils';
import { Rating } from '@/components/ui';

const CATEGORY_LABEL: Record<string, string> = {
  attraction: 'Attraction',
  museum: 'Museum',
  nature: 'Nature',
  adventure: 'Adventure',
  food: 'Food',
  shopping: 'Shopping',
  nightlife: 'Nightlife',
  experience: 'Experience',
  viewpoint: 'Viewpoint',
};

export function ActivityCard({
  poi,
  cityName,
  onSave,
  saved,
  onAdd,
  compact,
}: {
  poi: Poi & { cityName?: string };
  cityName?: string;
  onSave?: () => void;
  saved?: boolean;
  onAdd?: () => void;
  compact?: boolean;
}) {
  const [isSaved, setIsSaved] = useState(Boolean(saved));

  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card">
      <div className={cn('relative overflow-hidden', compact ? 'aspect-[16/10]' : 'aspect-[4/3]')}>
        <SafeImage
          src={poi.image}
          alt={poi.name}
          fill
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 90vw, 360px"
        />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-2xs font-medium text-ink backdrop-blur">
            {CATEGORY_LABEL[poi.category] ?? poi.category}
          </span>
          <button
            aria-label="Save activity"
            onClick={() => {
              setIsSaved((v) => !v);
              onSave?.();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-mute backdrop-blur transition hover:text-clay-600"
          >
            <Heart size={13} className={isSaved ? 'fill-clay-500 text-clay-500' : ''} />
          </button>
        </div>
        {poi.indoor ? (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2 py-0.5 text-2xs text-white backdrop-blur">
            <Umbrella size={9} /> Indoor
          </span>
        ) : (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink/70 px-2 py-0.5 text-2xs text-white backdrop-blur">
            <Sun size={9} /> Outdoor
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-medium text-ink">{poi.name}</h3>
          <Rating value={poi.rating} />
        </div>
        <p className="mt-1 flex items-center gap-1 text-2xs text-ink-mute">
          <MapPin size={10} /> {poi.area}
          {cityName ? `, ${cityName}` : ''}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-mute">{poi.description}</p>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
          <div className="flex items-center gap-3 text-2xs text-ink-mute">
            <span className="inline-flex items-center gap-1">
              <Clock size={10} /> {durationLabel(poi.durationMin)}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-ink">
              <Ticket size={10} /> {poi.costINR ? inr(poi.costINR) : 'Free'}
            </span>
          </div>
          {onAdd ? (
            <button onClick={onAdd} className="rounded-full border border-line px-2.5 py-1 text-2xs font-medium text-ink-soft transition hover:border-ink hover:text-ink">
              + Add to itinerary
            </button>
          ) : null}
        </div>
        <p className="mt-1.5 text-2xs text-ink-faint">Open {poi.hours}</p>
      </div>
    </article>
  );
}
