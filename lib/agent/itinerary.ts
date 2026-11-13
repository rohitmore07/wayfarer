import { cityById } from '@/lib/data/cities';
import { haversine } from '@/lib/data/airports';
import type { City, DayActivity, ItineraryDay, Poi, TravelBrief } from '@/lib/types';
import type { WeatherDay } from '@/lib/providers/weather';
import { addDays } from '@/lib/utils';

/** Split `days` across cities, front-loading extra days to the first cities. */
export function allocateDays(cityIds: string[], days: number): { cityId: string; nights: number }[] {
  const ids = cityIds.slice(0, Math.max(1, days));
  if (!ids.length) return [];
  const base = Math.floor(days / ids.length);
  let rem = days % ids.length;
  return ids.map((cityId) => {
    const extra = rem > 0 ? 1 : 0;
    if (rem > 0) rem--;
    return { cityId, nights: Math.max(1, base + extra) };
  });
}

const interestScore = (poi: Poi, brief: TravelBrief) =>
  poi.interests.filter((i) => brief.interests.includes(i)).length * 2 + poi.rating / 2;

function pickAnchor(pool: Poi[], brief: TravelBrief, used: Set<string>, last?: Poi): Poi | null {
  const available = pool.filter((p) => !used.has(p.id));
  if (!available.length) return null;
  const scored = [...available].sort((a, b) => interestScore(b, brief) - interestScore(a, brief));
  if (!last) return scored[0];
  // Prefer something a reasonable distance from yesterday's cluster, but still a top match
  const top = scored.slice(0, 4);
  return top.reduce((best, p) => {
    const d = haversine(p.lat, p.lng, last.lat, last.lng);
    const dBest = haversine(best.lat, best.lng, last.lat, last.lng);
    const ideal = (x: number) => Math.abs(x - 4);
    return ideal(d) < ideal(dBest) ? p : best;
  }, top[0]);
}

const transportBetween = (from: { lat: number; lng: number } | null, to: Poi, city: City) => {
  if (!from) return undefined;
  const km = haversine(from.lat, from.lng, to.lat, to.lng);
  if (km < 1.4)
    return {
      mode: 'walk' as const,
      minutes: Math.max(6, Math.round((km / 4.5) * 60)),
      costINR: 0,
      note: `${km.toFixed(1)} km walk`,
    };
  if (km < 18)
    return {
      mode: 'metro' as const,
      minutes: Math.round((km / 24) * 60) + 8,
      costINR: city.id === 'new-york' ? 250 : city.id === 'paris' ? 200 : city.id === 'reykjavik' ? 350 : 70,
      note: `${km.toFixed(1)} km by ${city.id === 'new-york' ? 'subway' : 'metro'}`,
    };
  return {
    mode: 'taxi' as const,
    minutes: Math.round((km / 26) * 60) + 6,
    costINR: Math.round(120 + km * (city.id === 'reykjavik' ? 210 : city.id === 'paris' ? 110 : 42)),
    note: `${km.toFixed(1)} km by taxi`,
  };
};

const toHHMM = (minutesFromMidnight: number) => {
  const h = Math.floor(minutesFromMidnight / 60) % 24;
  const m = Math.round(minutesFromMidnight % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const toActivity = (
  poi: Poi,
  slot: DayActivity['slot'],
  startTime: string,
  transport?: DayActivity['transport'],
  provenance: DayActivity['provenance'] = 'ai'
): DayActivity => ({
  id: `act_${poi.id}_${slot}_${Math.random().toString(36).slice(2, 6)}`,
  poiId: poi.id,
  name: poi.name,
  cityId: poi.cityId,
  slot,
  startTime,
  durationMin: poi.durationMin,
  costINR: poi.costINR,
  category: poi.category,
  area: poi.area,
  lat: poi.lat,
  lng: poi.lng,
  description: poi.description,
  image: poi.image,
  transport,
  provenance,
});

export interface BuildOptions {
  weather?: Record<string, WeatherDay[]>;
  /** Force specific POIs into a day (used by "regenerate this day") */
  avoidPoiIds?: string[];
  seed?: number;
}

export function buildItinerary(brief: TravelBrief, options: BuildOptions = {}): ItineraryDay[] {
  const allocation = allocateDays(brief.cityIds, brief.days);
  const used = new Set<string>(options.avoidPoiIds ?? []);
  const days: ItineraryDay[] = [];
  const activityTarget = brief.pace === 'packed' ? 4 : brief.pace === 'relaxed' ? 2 : 3;
  let lastPoi: Poi | undefined;
  let cursorCity: string | null = null;

  allocation.forEach((alloc, cityIdx) => {
    const city = cityById(alloc.cityId);
    if (!city) return;
    for (let d = 0; d < alloc.nights; d++) {
      const dayNumber = days.length + 1;
      const date = addDays(brief.startDate, dayNumber - 1);
      const weather = options.weather?.[alloc.cityId]?.find((w) => w.date === date) ??
        options.weather?.[alloc.cityId]?.[d];
      const rainy = (weather?.rainMm ?? 0) >= 8;

      const arriving = dayNumber === 1;
      const departing = dayNumber === brief.days;
      const firstDayInCity = cursorCity !== alloc.cityId;
      cursorCity = alloc.cityId;

      const pool: Poi[] = city.pois.filter((p) => (rainy ? true : true));
      const anchor = pickAnchor(pool, brief, used, lastPoi);
      if (anchor) used.add(anchor.id);

      const chosen: { poi: Poi; slot: DayActivity['slot'] }[] = [];
      if (anchor) chosen.push({ poi: anchor, slot: anchor.bestTime === 'evening' ? 'afternoon' : 'morning' });

      const target = Math.max(1, activityTarget - (arriving ? 1 : 0) - (departing ? 1 : 0));
      const allNeighbours: { p: Poi; km: number; score: number }[] = pool
        .filter((p) => !used.has(p.id) && anchor)
        .map((p) => ({
          p,
          km: haversine(anchor!.lat, anchor!.lng, p.lat, p.lng),
          score: interestScore(p, brief) - haversine(anchor!.lat, anchor!.lng, p.lat, p.lng) * 0.55,
        }))
        .sort((a, b) => b.score - a.score);

      // Start tight for geography, then relax the radius only as far as needed
      const desired = Math.max(1, activityTarget - (arriving ? 1 : 0) - (departing ? 1 : 0)) - 1;
      const neighbours: { p: Poi; km: number; score: number }[] = [];
      for (const radius of [7, 14, 40]) {
        for (const n of allNeighbours) {
          if (neighbours.length >= desired) break;
          if (n.km <= radius && !neighbours.some((x) => x.p.id === n.p.id)) neighbours.push(n);
        }
        if (neighbours.length >= desired) break;
      }
      neighbours.sort((a, b) => b.score - a.score);

      for (const n of neighbours) {
        if (chosen.length >= target) break;
        if (chosen.some((c) => c.poi.id === n.p.id)) continue;
        if (rainy && !n.p.indoor) {
          const indoorAlt = neighbours.find((x) => x.p.indoor && !chosen.some((c) => c.poi.id === x.p.id));
          if (indoorAlt) {
            chosen.push({ poi: indoorAlt.p, slot: chosen.length === 1 ? 'afternoon' : 'morning' });
            used.add(indoorAlt.p.id);
            continue;
          }
        }
        chosen.push({ poi: n.p, slot: chosen.length === 1 ? 'afternoon' : chosen.length === 2 ? 'evening' : 'afternoon' });
        used.add(n.p.id);
      }

      // Evening food slot — dinner recommendation from the destination's food POIs
      const dinnerPool = city.pois
        .filter((p) => (p.category === 'food' || p.category === 'nightlife') && !p.tags.includes('breakfast') && !p.tags.includes('early-morning'))
        .sort((a, b) => b.rating - a.rating);
      const dinner = dinnerPool.find((p) => !used.has(p.id));

      const morningStart = brief.avoidEarlyMornings ? 10 * 60 + 30 : arriving ? 14 * 60 : 9 * 60;
      let clock = morningStart;
      const activities: DayActivity[] = [];
      let prev: { lat: number; lng: number } | null = null;

      chosen.forEach((c, idx) => {
        const transport = idx === 0 ? undefined : transportBetween(prev, c.poi, city);
        if (transport) clock += transport.minutes;
        const slot: DayActivity['slot'] = clock < 12 * 60 ? 'morning' : clock < 17 * 60 ? 'afternoon' : 'evening';
        activities.push(toActivity(c.poi, slot, toHHMM(clock), transport));
        clock += c.poi.durationMin + 15;
        prev = c.poi;
      });

      if (dinner && activities.length) {
        const transport = transportBetween(prev, dinner, city);
        if (transport) clock += transport.minutes;
        const dinnerTime = Math.max(clock, 19 * 60);
        const mealAct = toActivity(dinner, 'evening', toHHMM(dinnerTime), transport);
        mealAct.meal = 'dinner';
        mealAct.durationMin = 90;
        activities.push(mealAct);
        used.add(dinner.id);
        prev = dinner;
      }

      const foodEstimate = Math.round(city.dailyBudget.comfort * 0.42);
      const transportCost = activities.reduce((sum, a) => sum + (a.transport?.costINR ?? 0), 0);
      const activityCost = activities.filter((a) => a.meal !== 'dinner').reduce((sum, a) => sum + a.costINR, 0);

      const areas = [...new Set(activities.map((a) => a.area))].slice(0, 2);
      const title = arriving
        ? `Arrive in ${city.name}, ease in around ${activities[0]?.area ?? city.name}`
        : departing
          ? `Final morning in ${city.name} & departure`
          : `${areas.join(' & ')} — ${activities[0]?.name.split(',')[0] ?? city.name}`;

      days.push({
        day: dayNumber,
        date,
        cityId: city.id,
        cityName: city.name,
        title,
        summary: arriving
          ? `Land, check in and keep the first day light — one anchor sight plus an easy dinner near your hotel.`
          : firstDayInCity
            ? `First full day in ${city.name}: ${activities
                .filter((a) => a.meal !== 'dinner')
                .map((a) => a.name.split(',')[0])
                .slice(0, 3)
                .join(' → ')}.`
            : `${activities
                .filter((a) => a.meal !== 'dinner')
                .map((a) => a.name.split(',')[0])
                .slice(0, 3)
                .join(' → ')}. Grouped to keep travel under 20 minutes between stops.`,
        activities,
        dailyCostINR: foodEstimate + transportCost + activityCost,
        weather: weather
          ? {
              highC: weather.highC,
              lowC: weather.lowC,
              rainMm: weather.rainMm,
              summary: weather.summary,
              source: weather.source === 'live' ? 'live' : 'estimated',
            }
          : undefined,
        notes: [
          dinner ? `Dinner: ${dinner.name} — ${dinner.area}.` : null,
          rainy ? 'Rain likely: indoor alternatives prioritised.' : null,
          arriving ? 'Airport transfer is included in your transport budget.' : null,
        ]
          .filter(Boolean)
          .join(' '),
      });

      lastPoi = activities.find((a) => a.meal !== 'dinner')
        ? (city.pois.find((p) => p.id === activities.find((a) => a.meal !== 'dinner')!.poiId) ?? anchor ?? undefined)
        : anchor ?? undefined;
    }
  });

  return days;
}

/** Regenerate a single day while keeping the rest of the trip intact. */
export function regenerateDay(
  brief: TravelBrief,
  itinerary: ItineraryDay[],
  dayNumber: number,
  options: BuildOptions = {}
): ItineraryDay[] {
  const target = itinerary.find((d) => d.day === dayNumber);
  if (!target) return itinerary;

  const usedElsewhere = new Set(
    itinerary.filter((d) => d.day !== dayNumber).flatMap((d) => d.activities.map((a) => a.poiId))
  );
  const usedToday = new Set(target.activities.map((a) => a.poiId));

  const singleBrief: TravelBrief = { ...brief, days: 1, cityIds: [target.cityId], startDate: target.date };
  const [fresh] = buildItinerary(singleBrief, {
    ...options,
    avoidPoiIds: [...usedElsewhere, ...usedToday],
  });

  const rebuilt = fresh ?? target;
  return itinerary.map((d) =>
    d.day === dayNumber
      ? {
          ...rebuilt,
          day: target.day,
          date: target.date,
          cityId: target.cityId,
          cityName: target.cityName,
          weather: target.weather,
          title: rebuilt.title,
        }
      : d
  );
}

export const SLOT_LABEL: Record<DayActivity['slot'], string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};
