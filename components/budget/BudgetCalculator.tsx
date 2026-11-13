'use client';

import { useMemo, useState } from 'react';
import { Calculator, Info, Plane, Wallet } from 'lucide-react';
import { CITIES } from '@/lib/data/cities';
import { hotelsByCity } from '@/lib/data/hotels';
import { estimateFlightPrice } from '@/lib/providers/flights';
import { BudgetDonut } from '@/components/trip/BudgetPanel';
import type { BudgetPlan } from '@/lib/types';
import { cn, inr } from '@/lib/utils';

const VISA: Record<string, number> = { JP: 4200, ID: 2900, VN: 2400, TH: 3200, SG: 3100, FR: 8800, IS: 9200, CH: 8800, AE: 7500, US: 16500, IN: 0 };

export function BudgetCalculator({ originCode = 'BOM' }: { originCode?: string }) {
  const [cityId, setCityId] = useState('kyoto');
  const [days, setDays] = useState(7);
  const [travelers, setTravelers] = useState(2);
  const [style, setStyle] = useState<'budget' | 'comfort' | 'luxury'>('comfort');
  const [includeFlights, setIncludeFlights] = useState(true);

  const plan: BudgetPlan = useMemo(() => {
    const city = CITIES.find((c) => c.id === cityId)!;
    const nights = Math.max(1, days - 1);
    const rooms = Math.ceil(travelers / 2);
    const hotel = hotelsByCity(cityId).find((h) => h.tier === style) ?? hotelsByCity(cityId)[0];
    const flight = includeFlights ? estimateFlightPrice(originCode, city.airportCode) * 2 : 0;
    const daily = city.dailyBudget[style];

    const categories = [
      { key: 'flights' as const, label: 'Flights', perPerson: flight, total: flight * travelers, note: 'Round trip, per person', provenance: 'estimated' as const },
      { key: 'stay' as const, label: 'Accommodation', perPerson: Math.round((hotel.pricePerNight * nights * rooms) / travelers), total: hotel.pricePerNight * nights * rooms, note: `${nights} nights · ${rooms} room${rooms > 1 ? 's' : ''}`, provenance: 'mock' as const },
      { key: 'food' as const, label: 'Food & dining', perPerson: Math.round(daily * 0.42 * days), total: Math.round(daily * 0.42 * days) * travelers, note: 'Three meals a day', provenance: 'estimated' as const },
      { key: 'transport' as const, label: 'Local transport', perPerson: Math.round(daily * 0.18 * days) + 1200, total: (Math.round(daily * 0.18 * days) + 1200) * travelers, note: 'Metro, taxis, airport transfers', provenance: 'estimated' as const },
      { key: 'activities' as const, label: 'Activities & experiences', perPerson: Math.round(daily * 0.3 * days), total: Math.round(daily * 0.3 * days) * travelers, note: 'Entries and tours', provenance: 'estimated' as const },
      { key: 'shopping' as const, label: 'Shopping', perPerson: Math.round(daily * 0.2 * days), total: Math.round(daily * 0.2 * days) * travelers, note: 'Suggested allowance', provenance: 'estimated' as const },
      { key: 'misc' as const, label: 'Visa, insurance & eSIM', perPerson: (VISA[city.countryCode] ?? 3000) + 2500, total: ((VISA[city.countryCode] ?? 3000) + 2500) * travelers, note: `${city.countryCode} entry costs`, provenance: 'estimated' as const },
    ];
    const estimatedTotal = categories.reduce((s, c) => s + c.total, 0);
    return {
      currency: 'INR' as const,
      totalBudget: estimatedTotal,
      estimatedTotal,
      perPerson: Math.round(estimatedTotal / travelers),
      daily: Math.round(estimatedTotal / days),
      categories,
      warnings: [],
      savings: [],
      provenance: 'estimated' as const,
    };
  }, [cityId, days, travelers, style, includeFlights, originCode]);

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <Calculator size={14} className="text-clay-500" /> Trip cost calculator
          </p>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-2xs text-ink-faint">Destination</span>
              <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="field py-2.5 text-sm">
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-2xs text-ink-faint">Days</span>
                <input type="number" min={2} max={30} value={days} onChange={(e) => setDays(Math.max(2, Number(e.target.value)))} className="field py-2.5 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-2xs text-ink-faint">Travellers</span>
                <input type="number" min={1} max={10} value={travelers} onChange={(e) => setTravelers(Math.max(1, Number(e.target.value)))} className="field py-2.5 text-sm" />
              </label>
            </div>
            <div>
              <span className="mb-1.5 block text-2xs text-ink-faint">Travel style</span>
              <div className="flex rounded-full border border-line bg-parchment p-1">
                {(['budget', 'comfort', 'luxury'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={cn('flex-1 rounded-full px-2 py-1.5 text-2xs font-medium capitalize', style === s ? 'bg-white text-ink shadow-sm' : 'text-ink-mute')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between rounded-xl bg-parchment px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <Plane size={12} /> Include flights from {originCode}
              </span>
              <input type="checkbox" checked={includeFlights} onChange={(e) => setIncludeFlights(e.target.checked)} className="h-4 w-4 accent-clay-500" />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-parchment p-4 text-2xs leading-relaxed text-ink-mute">
          <Info size={12} className="mb-1 text-ink-faint" />
          Estimates are modelled from destination cost data and route distance. They are not quotes — the AI trip planner
          refines them against real itinerary choices.
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-caps">Estimated total</p>
            <p className="mt-1 font-display text-[34px] leading-none text-ink">{inr(plan.estimatedTotal)}</p>
            <p className="mt-1 text-xs text-ink-mute">
              {inr(plan.perPerson)} per person · {inr(plan.daily ?? 0)} per day
            </p>
          </div>
          <BudgetDonut plan={plan} size={150} />
        </div>

        <div className="mt-5 space-y-2.5">
          {plan.categories.map((c) => {
            const share = (c.total / plan.estimatedTotal) * 100;
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">{c.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-2xs text-ink-faint">{share.toFixed(0)}%</span>
                    <span className="w-20 text-right font-medium text-ink">{inr(c.total)}</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sand">
                  <div className="h-full rounded-full bg-pine-600/70" style={{ width: `${share}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-pine-50 px-3 py-2.5 text-2xs text-pine-600">
          <Wallet size={12} /> Travelling in the shoulder season usually saves 12–18% on stays in this destination.
        </div>
      </div>
    </div>
  );
}
