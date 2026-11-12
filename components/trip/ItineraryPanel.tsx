'use client';

import { SafeImage } from '@/components/ui/SafeImage';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  CloudRain,
  CloudSun,
  GripVertical,
  MapPin,
  RefreshCw,
  Sun,
  Trash2,
  TrainFront,
  Footprints,
  Car,
  UtensilsCrossed,
} from 'lucide-react';
import type { DayActivity, ItineraryDay } from '@/lib/types';
import { cn, durationLabel, fmtDate, inr } from '@/lib/utils';
import { TripMap, pointsFromActivities } from './TripMap';

const SLOT_ORDER: DayActivity['slot'][] = ['morning', 'afternoon', 'evening'];
const SLOT_LABEL: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

const TRANSPORT_ICON = { walk: Footprints, metro: TrainFront, taxi: Car, train: TrainFront, ferry: TrainFront };

function retime(day: ItineraryDay): ItineraryDay {
  let clock = 9 * 60;
  const activities = [...day.activities].sort(
    (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) || a.startTime.localeCompare(b.startTime)
  );
  const retimed = activities.map((a, idx) => {
    if (idx > 0 && a.transport) clock += a.transport.minutes;
    const slot: DayActivity['slot'] = clock < 12 * 60 ? 'morning' : clock < 17 * 60 ? 'afternoon' : 'evening';
    const startTime = `${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(Math.round(clock % 60)).padStart(2, '0')}`;
    clock += a.durationMin + 15;
    return { ...a, slot, startTime };
  });
  return {
    ...day,
    activities: retimed,
    dailyCostINR: day.dailyCostINR,
  };
}

export function ItineraryPanel({
  itinerary,
  editable,
  onChange,
  onRegenerateDay,
  onRemoveActivity,
  highlightDay,
}: {
  itinerary: ItineraryDay[];
  editable?: boolean;
  onChange?: (days: ItineraryDay[]) => void;
  onRegenerateDay?: (day: number) => void | Promise<void>;
  onRemoveActivity?: (day: number, activityId: string) => void;
  highlightDay?: number;
}) {
  const [openDays, setOpenDays] = useState<number[]>(() => {
    const first = highlightDay ?? itinerary[0]?.day ?? 1;
    return [first];
  });
  const [dragItem, setDragItem] = useState<{ day: number; activityId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [mapDay, setMapDay] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState<number | null>(null);

  const toggle = (day: number) =>
    setOpenDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const mapPoints = useMemo(() => {
    if (mapDay) return pointsFromActivities(itinerary.filter((d) => d.day === mapDay));
    return pointsFromActivities(itinerary);
  }, [itinerary, mapDay]);

  const moveActivity = (targetDay: number, targetSlot: DayActivity['slot']) => {
    if (!dragItem || !onChange) return;
    const source = itinerary.find((d) => d.day === dragItem.day);
    const activity = source?.activities.find((a) => a.id === dragItem.activityId);
    if (!source || !activity) return;
    if (source.day === targetDay && activity.slot === targetSlot) return;

    const next = itinerary.map((day) => {
      if (day.day === source.day) {
        return retime({ ...day, activities: day.activities.filter((a) => a.id !== activity.id) });
      }
      if (day.day === targetDay) {
        return retime({ ...day, activities: [...day.activities, { ...activity, slot: targetSlot }] });
      }
      return day;
    });
    onChange(next);
    setDragItem(null);
    setDropTarget(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setMapDay(null)}
            className={cn('rounded-full border px-3 py-1.5 text-2xs font-medium transition', mapDay === null ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-ink-soft hover:border-line-strong')}
          >
            Whole trip map
          </button>
          {itinerary.map((d) => (
            <button
              key={d.day}
              onClick={() => setMapDay(d.day)}
              className={cn('rounded-full border px-2.5 py-1.5 text-2xs font-medium transition', mapDay === d.day ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-ink-soft hover:border-line-strong')}
            >
              Day {d.day}
            </button>
          ))}
        </div>
        {editable ? <p className="text-2xs text-ink-faint">Drag any stop to another day or time slot</p> : null}
      </div>

      <TripMap points={mapPoints} height={240} />

      <div className="space-y-2.5">
        {itinerary.map((day) => {
          const open = openDays.includes(day.day);
          const rainy = (day.weather?.rainMm ?? 0) >= 8;
          return (
            <section key={day.day} className="overflow-hidden rounded-2xl border border-line bg-white">
              <button
                onClick={() => toggle(day.day)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-parchment/60"
              >
                <span className="inline-flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-sand text-ink">
                  <span className="text-[9px] uppercase tracking-wide text-ink-faint">Day</span>
                  <span className="font-display text-base leading-none">{day.day}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-ink">{day.title}</span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-2xs text-ink-faint">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={10} /> {fmtDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={10} /> {day.cityName}
                    </span>
                    <span>{day.activities.length} stops</span>
                    <span>≈ {inr(day.dailyCostINR)}</span>
                  </span>
                </span>
                {day.weather ? (
                  <span
                    className={cn(
                      'hidden shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-2xs sm:inline-flex',
                      rainy ? 'border-sky-500/20 bg-sky-50 text-sky-500' : 'border-line bg-parchment text-ink-mute'
                    )}
                    title={`${day.weather.summary} · ${day.weather.source === 'live' ? 'live forecast' : 'climate normal'}`}
                  >
                    {rainy ? <CloudRain size={11} /> : <CloudSun size={11} />}
                    {day.weather.highC}°/{day.weather.lowC}°
                  </span>
                ) : null}
                <ChevronDown size={15} className={cn('shrink-0 text-ink-faint transition', open && 'rotate-180')} />
              </button>

              {open ? (
                <div className="border-t border-line px-4 pb-4 pt-3">
                  <p className="mb-3 text-xs leading-relaxed text-ink-mute">{day.summary}</p>

                  <div className="space-y-1">
                    {SLOT_ORDER.map((slot) => {
                      const items = day.activities.filter((a) => a.slot === slot);
                      const targetKey = `${day.day}-${slot}`;
                      return (
                        <div
                          key={slot}
                          onDragOver={(e) => {
                            if (!editable) return;
                            e.preventDefault();
                            setDropTarget(targetKey);
                          }}
                          onDragLeave={() => setDropTarget((t) => (t === targetKey ? null : t))}
                          onDrop={(e) => {
                            if (!editable) return;
                            e.preventDefault();
                            moveActivity(day.day, slot);
                          }}
                          className={cn(
                            'rounded-xl transition',
                            dropTarget === targetKey && 'drag-over bg-clay-50/60'
                          )}
                        >
                          <p className="label-caps mb-1.5 mt-2 px-1">{SLOT_LABEL[slot]}</p>
                          {items.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-line/80 px-3 py-2 text-2xs text-ink-faint">
                              Nothing planned — {editable ? 'drop a stop here' : 'free time'}
                            </div>
                          ) : null}
                          <div className="space-y-1.5">
                            {items.map((a) => {
                              const TIcon = a.transport ? TRANSPORT_ICON[a.transport.mode] ?? TrainFront : null;
                              return (
                                <div key={a.id}>
                                  {a.transport ? (
                                    <div className="flex items-center gap-1.5 py-0.5 pl-3 text-2xs text-ink-faint">
                                      {TIcon ? <TIcon size={10} /> : null}
                                      {a.transport.minutes} min · {a.transport.note}
                                      {a.transport.costINR ? ` · ${inr(a.transport.costINR)}` : ''}
                                    </div>
                                  ) : null}
                                  <div
                                    draggable={Boolean(editable)}
                                    onDragStart={(e) => {
                                      if (!editable) return;
                                      setDragItem({ day: day.day, activityId: a.id });
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragEnd={() => {
                                      setDragItem(null);
                                      setDropTarget(null);
                                    }}
                                    className={cn(
                                      'group flex items-center gap-3 rounded-xl border border-line/80 bg-white px-2.5 py-2 transition',
                                      editable && 'cursor-grab hover:border-line-strong hover:shadow-sm active:cursor-grabbing',
                                      dragItem?.activityId === a.id && 'opacity-40'
                                    )}
                                  >
                                    {editable ? <GripVertical size={13} className="shrink-0 text-line-strong group-hover:text-ink-faint" /> : null}
                                    <span className="w-10 shrink-0 text-2xs font-medium tabular-nums text-ink-mute">{a.startTime}</span>
                                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-sand">
                                      {a.image ? <SafeImage src={a.image} alt="" fill className="object-cover" sizes="36px" /> : null}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[13px] text-ink">
                                        {a.meal === 'dinner' ? (
                                          <span className="mr-1 inline-flex items-center gap-1 rounded bg-gold-400/15 px-1 py-0.5 text-[9px] uppercase tracking-wide text-gold-600">
                                            <UtensilsCrossed size={8} /> dinner
                                          </span>
                                        ) : null}
                                        {a.name}
                                      </span>
                                      <span className="mt-0.5 flex items-center gap-2 text-2xs text-ink-faint">
                                        <span>{durationLabel(a.durationMin)}</span>
                                        <span>·</span>
                                        <span>{a.area}</span>
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-2xs font-medium text-ink-mute">{a.costINR ? inr(a.costINR) : 'Free'}</span>
                                    {onRemoveActivity ? (
                                      <button
                                        onClick={() => onRemoveActivity(day.day, a.id)}
                                        className="shrink-0 rounded-md p-1 text-ink-faint opacity-0 transition hover:bg-clay-50 hover:text-clay-600 group-hover:opacity-100"
                                        aria-label={`Remove ${a.name}`}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {day.notes ? <p className="mt-3 rounded-lg bg-parchment px-3 py-2 text-2xs leading-relaxed text-ink-mute">{day.notes}</p> : null}

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <p className="text-2xs text-ink-faint">
                      Includes food, transport and entries · <span className="font-medium text-ink">{inr(day.dailyCostINR)}</span>
                    </p>
                    {onRegenerateDay ? (
                      <button
                        onClick={async () => {
                          setRegenerating(day.day);
                          await onRegenerateDay(day.day);
                          setRegenerating(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-2xs font-medium text-ink-soft transition hover:border-ink hover:text-ink"
                      >
                        <RefreshCw size={11} className={regenerating === day.day ? 'animate-spin' : ''} />
                        Regenerate day
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
