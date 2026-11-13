import { cityById } from '@/lib/data/cities';
import type { BudgetCategory, BudgetPlan, Flight, Hotel, ItineraryDay, TravelBrief } from '@/lib/types';

export interface BudgetInput {
  brief: TravelBrief;
  flight?: Flight | null;
  returnFlight?: Flight | null;
  hotel?: Hotel | null;
  flights?: Flight[];
  hotels?: Hotel[];
  itinerary: ItineraryDay[];
  /** Multi-city support: nights + chosen hotel per city */
  cityNights?: { cityId: string; nights: number }[];
  selectedHotels?: Record<string, Hotel | undefined>;
}

const VISA_AND_FEES: Record<string, number> = {
  JP: 4200,
  ID: 2900,
  VN: 2400,
  TH: 3200,
  SG: 3100,
  FR: 8800,
  IS: 9200,
  CH: 8800,
  AE: 7500,
  US: 16500,
  IN: 0,
};

export function computeBudget(input: BudgetInput): BudgetPlan {
  const { brief, itinerary } = input;
  const travelers = Math.max(1, brief.travelers);
  const nights = Math.max(1, brief.days - 1);
  const rooms = Math.ceil(travelers / 2);

  const primaryCity = cityById(brief.cityIds[0]);
  const countryCode = primaryCity?.countryCode ?? 'IN';

  const flightPerPerson = (input.flight?.price ?? 0) + (input.returnFlight?.price ?? input.flight?.price ?? 0);
  const flightsTotal = flightPerPerson * travelers;

  const stayBreakdown = input.cityNights?.length
    ? input.cityNights.map((cn) => ({
        cityId: cn.cityId,
        nights: cn.nights,
        hotel: input.selectedHotels?.[cn.cityId] ?? input.hotel ?? null,
      }))
    : [{ cityId: brief.cityIds[0], nights, hotel: input.hotel ?? null }];

  const stayTotal = stayBreakdown.reduce(
    (sum, b) => sum + (b.hotel?.pricePerNight ?? 0) * b.nights * rooms,
    0
  );
  const stayNights = stayBreakdown.reduce((s, b) => s + b.nights, 0) || nights;

  const foodPerPerson = itinerary.reduce((sum, day) => {
    const city = cityById(day.cityId);
    return sum + Math.round((city?.dailyBudget.comfort ?? 4000) * 0.4);
  }, 0);

  const transportPerPerson =
    itinerary.reduce((sum, day) => sum + day.activities.reduce((s, a) => s + (a.transport?.costINR ?? 0), 0), 0) +
    1600; // airport transfers both ways

  const activitiesPerPerson = itinerary.reduce(
    (sum, day) => sum + day.activities.filter((a) => a.meal !== 'dinner').reduce((s, a) => s + a.costINR, 0),
    0
  );

  const shoppingPerPerson = Math.round(brief.budgetPerPerson * 0.06);
  const visa = VISA_AND_FEES[countryCode] ?? 3000;
  const miscPerPerson = visa + 2500; // insurance + eSIM
  const stayPerPerson = stayTotal / travelers;

  const categories: BudgetCategory[] = [
    { key: 'flights', label: 'Flights', perPerson: flightPerPerson, total: flightsTotal, note: input.flight ? 'Round trip, per person' : 'Not selected yet', provenance: input.flight?.source === 'live' ? 'live' : 'mock' },
    { key: 'stay', label: 'Accommodation', perPerson: Math.round(stayPerPerson), total: stayTotal, note: `${stayNights} nights · ${rooms} room${rooms > 1 ? 's' : ''}${stayBreakdown.length > 1 ? ` · ${stayBreakdown.length} cities` : ''}`, provenance: 'mock' },
    { key: 'food', label: 'Food & dining', perPerson: foodPerPerson, total: foodPerPerson * travelers, note: 'Breakfast + lunch + dinner daily', provenance: 'estimated' },
    { key: 'transport', label: 'Local transport', perPerson: transportPerPerson, total: transportPerPerson * travelers, note: 'Metro, taxis and airport transfers', provenance: 'estimated' },
    { key: 'activities', label: 'Activities & experiences', perPerson: activitiesPerPerson, total: activitiesPerPerson * travelers, note: 'Entry tickets and tours', provenance: 'estimated' },
    { key: 'shopping', label: 'Shopping', perPerson: shoppingPerPerson, total: shoppingPerPerson * travelers, note: 'Suggested allowance', provenance: 'estimated' },
    { key: 'misc', label: 'Visa, insurance & eSIM', perPerson: miscPerPerson, total: miscPerPerson * travelers, note: `${countryCode} entry costs`, provenance: 'estimated' },
  ];

  const estimatedTotal = categories.reduce((s, c) => s + c.total, 0);
  const budgetTotal = brief.budgetPerPerson * travelers;

  const warnings: string[] = [];
  const over = estimatedTotal - budgetTotal;
  if (over > 0)
    warnings.push(
      `Your plan runs about ₹${over.toLocaleString('en-IN')} over budget (${Math.round((estimatedTotal / Math.max(1, budgetTotal)) * 100)}% of target).`
    );
  if (flightPerPerson > brief.budgetPerPerson * 0.45)
    warnings.push('Flights are eating more than 45% of the per-person budget — shifting dates can help.');
  if (stayPerPerson > brief.budgetPerPerson * 0.4)
    warnings.push('Accommodation is over 40% of budget. One tier lower would free up spending money.');
  if (brief.days > 9 && itinerary.length > 0)
    warnings.push('Long trips add up in food and transport — consider one "free" day with no paid activities.');

  const cheapestFlight = (input.flights ?? []).reduce<Flight | null>((a, f) => (!a || f.price < a.price ? f : a), null);
  const cheaperHotel = (input.hotels ?? [])
    .filter((h) => input.hotel && h.pricePerNight < input.hotel.pricePerNight && h.rating >= 8.3)
    .sort((a, b) => a.pricePerNight - b.pricePerNight)[0];

  const savings: BudgetPlan['savings'] = [];
  if (cheapestFlight && input.flight && cheapestFlight.price < input.flight.price) {
    const saving = (input.flight.price + (input.returnFlight?.price ?? 0) - (cheapestFlight.price * 2)) * travelers;
    if (saving > 0)
      savings.push({
        title: `Switch to ${cheapestFlight.carrierName} (${cheapestFlight.stops === 0 ? 'non-stop' : `${cheapestFlight.stops} stop`})`,
        detail: 'Same route, lower fare. You lose a little timing convenience.',
        savingINR: Math.round(saving),
      });
  }
  if (cheaperHotel && input.hotel) {
    savings.push({
      title: `Move to ${cheaperHotel.name} in ${cheaperHotel.area}`,
      detail: `Guest score ${cheaperHotel.rating}/10, still ${cheaperHotel.stars}★.`,
      savingINR: Math.round((input.hotel.pricePerNight - cheaperHotel.pricePerNight) * nights * rooms),
    });
  }
  savings.push({
    title: 'Eat breakfast at markets and konbini',
    detail: 'Two meals a day from markets instead of restaurants saves this without hurting the trip.',
    savingINR: Math.round(1200 * travelers * Math.max(1, brief.days - 2)),
  });
  if (brief.days >= 5)
    savings.push({
      title: 'Take a 24/48-hour transit pass',
      detail: 'Public transport passes pay for themselves on any day with 3+ rides.',
      savingINR: Math.round(650 * travelers * Math.min(brief.days, 5)),
    });
  savings.push({
    title: 'Trim the shopping allowance by half',
    detail: 'Keeps the experiences, cuts the impulse buys.',
    savingINR: Math.round(shoppingPerPerson * 0.5 * travelers),
  });

  const plan: BudgetPlan = {
    currency: 'INR',
    totalBudget: budgetTotal,
    estimatedTotal,
    perPerson: Math.round(estimatedTotal / travelers),
    daily: Math.round(estimatedTotal / Math.max(1, brief.days)),
    categories,
    warnings,
    savings: savings.sort((a, b) => b.savingINR - a.savingINR).slice(0, 4),
    provenance: categories.some((c) => c.provenance === 'live') ? 'estimated' : 'estimated',
  };
  return plan;
}

export function budgetUtilisation(plan: BudgetPlan) {
  return Math.min(140, (plan.estimatedTotal / Math.max(1, plan.totalBudget)) * 100);
}
