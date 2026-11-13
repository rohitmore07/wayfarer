import { cityById } from '@/lib/data/cities';
import { airportByCode } from '@/lib/data/airports';
import { searchFlights, estimateFlightPrice } from '@/lib/providers/flights';
import { searchHotels, hotelForCity } from '@/lib/providers/hotels';
import { hotelsByCity } from '@/lib/data/hotels';
import { getWeather, weatherAdvice, type WeatherDay } from '@/lib/providers/weather';
import { allocateDays, buildItinerary, regenerateDay } from './itinerary';
import { computeBudget } from './budget';
import { defaultBrief, mergeBrief, parseBrief } from './parse';
import { findDestinations } from './destination';
import { AGENT_SYSTEM, llmEnabled, llmJson, llmText } from './llm';
import type {
  AgentStep,
  Flight,
  Hotel,
  HotelClass,
  ItineraryDay,
  PlanPayload,
  TravelBrief,
} from '@/lib/types';
import { addDays, daysBetween } from '@/lib/utils';
import { buildPackingList, safetyBriefing } from '@/lib/extras';

export { buildPackingList, safetyBriefing };

export type AgentEvent =
  | { type: 'step'; step: AgentStep }
  | { type: 'token'; delta: string }
  | { type: 'plan'; plan: PlanPayload }
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface PlanResult {
  plan: PlanPayload;
  message: string;
  steps: AgentStep[];
  missing: string[];
  followUps: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STEP_LABEL = {
  planner: 'Travel Planning Agent',
  destination: 'Destination Research Agent',
  flight: 'Flight Search Agent',
  hotel: 'Hotel Recommendation Agent',
  itinerary: 'Itinerary Agent',
  budget: 'Budget Agent',
  weather: 'Weather service',
  safety: 'Safety service',
} as const;

function makeStep(agent: AgentStep['agent'], label: string): AgentStep {
  return { id: `${agent}-${Math.random().toString(36).slice(2, 7)}`, agent, label, status: 'pending' };
}

/* -------------------------------------------------------------------------- */
/*  Optional LLM enrichment — extracts structure from messy requests           */
/* -------------------------------------------------------------------------- */

interface LlmBrief {
  destination?: string;
  cities?: string[];
  days?: number;
  travelers?: number;
  budget_per_person_inr?: number;
  month?: string;
  start_date?: string;
  interests?: string[];
  hotel_class?: 'budget' | 'comfort' | 'luxury';
  pace?: 'relaxed' | 'balanced' | 'packed';
  avoid_early_mornings?: boolean;
  notes?: string;
}

async function enrichWithLlm(text: string): Promise<Partial<TravelBrief> | null> {
  if (!llmEnabled()) return null;
  const parsed = await llmJson<LlmBrief>(
    `${AGENT_SYSTEM}
Extract travel planning fields from the user's message. Respond in JSON only with this shape:
{"destination":"Japan","cities":["Tokyo","Kyoto","Osaka"],"days":7,"travelers":2,
"budget_per_person_inr":150000,"start_date":"2026-03-12","interests":["culture","food"],
"hotel_class":"comfort","pace":"balanced","avoid_early_mornings":false,"notes":""}
Omit fields you are not confident about. Never invent a budget or date.`,
    text
  );
  if (!parsed) return null;
  const patch: Partial<TravelBrief> = {};
  if (parsed.days && parsed.days > 0 && parsed.days < 45) patch.days = parsed.days;
  if (parsed.travelers && parsed.travelers > 0 && parsed.travelers < 20) patch.travelers = parsed.travelers;
  if (parsed.budget_per_person_inr && parsed.budget_per_person_inr >= 5000)
    patch.budgetPerPerson = parsed.budget_per_person_inr;
  if (parsed.start_date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.start_date)) patch.startDate = parsed.start_date;
  if (parsed.hotel_class) patch.hotelClass = parsed.hotel_class;
  if (parsed.pace) patch.pace = parsed.pace;
  if (parsed.avoid_early_mornings) patch.avoidEarlyMornings = true;
  if (parsed.interests?.length)
    patch.interests = parsed.interests.filter((i) =>
      ['culture', 'food', 'nature', 'adventure', 'nightlife', 'shopping', 'art', 'history', 'photography', 'relaxation', 'family', 'anime'].includes(i)
    ) as TravelBrief['interests'];
  return patch;
}

/* -------------------------------------------------------------------------- */
/*  Main planning pipeline                                                     */
/* -------------------------------------------------------------------------- */

export async function planTrip(
  input: { text: string; defaults?: Partial<TravelBrief> },
  emit: (e: AgentEvent) => void = () => {}
): Promise<PlanResult> {
  const steps: AgentStep[] = [];
  const run = async <T>(agent: AgentStep['agent'], label: string, fn: () => Promise<T> | T, detail?: (r: T) => string): Promise<T> => {
    const step = makeStep(agent, label);
    steps.push(step);
    emit({ type: 'step', step: { ...step, status: 'running' } });
    const t0 = Date.now();
    try {
      const result = await fn();
      const done: AgentStep = {
        ...step,
        status: 'done',
        ms: Date.now() - t0,
        detail: detail ? detail(result) : undefined,
      };
      const idx = steps.findIndex((s) => s.id === step.id);
      steps[idx] = done;
      emit({ type: 'step', step: done });
      return result;
    } catch (err) {
      const failed: AgentStep = { ...step, status: 'error', detail: (err as Error).message, ms: Date.now() - t0 };
      const idx = steps.findIndex((s) => s.id === step.id);
      steps[idx] = failed;
      emit({ type: 'step', step: failed });
      throw err;
    }
  };

  /* 1. Understand the request */
  const parsed = await run('planner', 'Reading your request', async () => {
    const regex = parseBrief(input.text, input.defaults);
    const llm = await enrichWithLlm(input.text);
    await sleep(220);
    return { ...regex, brief: { ...regex.brief, ...(llm ?? {}) } };
  }, (r) => (r.interpreted.length ? r.interpreted.join(' · ') : 'Ambiguous request — applying sensible defaults'));

  let brief: TravelBrief = mergeBrief({ ...defaultBrief(), ...(input.defaults ?? {}) }, parsed.brief);

  /* 1b. If no destination, run the destination finder */
  const needsSuggestion = !brief.cityIds?.length;
  if (needsSuggestion) {
    const suggestions = await run('destination', 'Finding destinations that fit', async () => {
      await sleep(240);
      return findDestinations({
        budgetPerPerson: brief.budgetPerPerson,
        days: brief.days,
        month: new Date(brief.startDate).getMonth() + 1,
        interests: brief.interests,
        originCode: brief.originCode,
      }).slice(0, 3);
    }, (r) => r.map((s) => s.city.name).join(', '));
    brief = { ...brief, cityIds: suggestions.map((s) => s.city.id) };
  }

  brief.cityIds = brief.cityIds.filter((id) => cityById(id));
  if (!brief.cityIds.length) brief.cityIds = ['tokyo'];

  const cities = brief.cityIds.map((id) => cityById(id)!);
  const allocation = allocateDays(brief.cityIds, brief.days);
  const endDate = addDays(brief.startDate, Math.max(1, brief.days));

  /* 2. Research + weather in parallel */
  const weatherByCity = await run('weather', 'Checking seasonal weather & forecasts', async () => {
    const entries = await Promise.all(
      cities.map(async (c) => [c.id, await getWeather(c.id, brief.startDate, brief.days)] as const)
    );
    return Object.fromEntries(entries) as Record<string, WeatherDay[]>;
  }, (r) => {
    const sample = Object.values(r)[0]?.[0];
    return sample ? `${sample.source === 'live' ? 'Live forecast' : 'Climate normals'} · ${sample.highC}°C / ${sample.lowC}°C` : 'Climate normals used';
  });

  /* 3. Flights */
  const flightResult = await run('flight', `Searching flights from ${brief.originCode}`, async () => {
    const out = await searchFlights({
      origin: brief.originCode,
      destination: cities[0].airportCode,
      departDate: brief.startDate,
      travelers: brief.travelers,
      cabin: brief.cabin ?? (brief.hotelClass === 'luxury' ? 'premium' : 'economy'),
    });
    const ret = await searchFlights({
      origin: cities[cities.length - 1].airportCode,
      destination: brief.originCode,
      departDate: endDate,
      travelers: brief.travelers,
      cabin: brief.cabin ?? 'economy',
    });
    return { out, ret };
  }, (r) =>
    `${r.out.flights.length} options · from ${'₹' + Math.min(...r.out.flights.map((f) => f.price)).toLocaleString('en-IN')} · ${r.out.source === 'amadeus' ? 'live (Amadeus)' : 'demo engine'}`);

  const flights = flightResult.out.flights;
  const returnFlights = flightResult.ret.flights;
  const selectedFlight =
    flights.find((f) => f.tags.includes('recommended')) ?? flights.find((f) => f.tags.includes('cheapest')) ?? flights[0];
  const selectedReturn =
    returnFlights.find((f) => f.tags.includes('recommended')) ??
    returnFlights.find((f) => f.tags.includes('cheapest')) ??
    returnFlights[0];

  /* 4. Hotels per city — budget-aware so the plan lands inside the target */
  const nightsTotal = Math.max(1, brief.days - 1);
  const rooms = Math.ceil(Math.max(1, brief.travelers) / 2);
  const flightsTotal = (selectedFlight?.price ?? 0) * 2 * brief.travelers + (selectedReturn?.price ?? 0) * 0;
  const dailySpend = cities.reduce((s, c) => s + c.dailyBudget.comfort, 0) * (nightsTotal / cities.length) * brief.travelers;
  const fixedMisc = 7500 * brief.travelers;
  const stayEnvelope = brief.budgetPerPerson * brief.travelers - flightsTotal - dailySpend - fixedMisc;
  const maxNightly = Math.max(1800, Math.floor(stayEnvelope / nightsTotal / rooms / 100) * 100);

  const hotels = await run('hotel', 'Shortlisting stays close to your itinerary', async () => {
    const out: Hotel[] = [];
    for (const city of cities) {
      const preferred = searchHotels({ cityId: city.id, tier: brief.hotelClass, guests: brief.travelers }, city.pois);
      const affordable = preferred.filter((h) => h.pricePerNight <= maxNightly);
      let ordered = affordable.length ? affordable : preferred;
      if (!affordable.length) {
        // nothing in the preferred tier fits the envelope — offer the best value anywhere
        const anyPrice = searchHotels({ cityId: city.id, guests: brief.travelers }, city.pois).filter(
          (h) => h.pricePerNight <= maxNightly
        );
        if (anyPrice.length) ordered = anyPrice;
      }
      const cheapest = [...preferred].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
      const rest = preferred.filter((h) => h.id !== cheapest?.id);
      const chosen = [ordered[0], ...rest].filter(Boolean) as Hotel[];
      const unique = Array.from(new Map(chosen.map((h) => [h.id, h])).values());
      out.push(...unique.slice(0, 5));
    }
    await sleep(180);
    return out;
  }, (r) => `${r.length} properties within ₹${maxNightly.toLocaleString('en-IN')}/night · ${r.filter((h) => h.rating >= 9).length} rated 9+`);

  const hotelSelections: Record<string, string> = {};
  cities.forEach((c) => {
    const pick = hotels.find((h) => h.cityId === c.id);
    if (pick) hotelSelections[c.id] = pick.id;
  });

  /* 5. Itinerary */
  const itinerary = await run('itinerary', 'Building a geographically sensible day plan', async () => {
    await sleep(240);
    return buildItinerary(brief, { weather: weatherByCity });
  }, (r) => `${r.length} days · ${r.reduce((s, d) => s + d.activities.length, 0)} activities · ${new Set(r.map((d) => d.cityId)).size} cities`);

  /* 6. Budget */
  const selectedHotel = hotels.find((h) => h.id === hotelSelections[cities[0].id]) ?? hotels[0];
  const selectedHotels = Object.fromEntries(
    Object.entries(hotelSelections).map(([cityId, id]) => [cityId, hotels.find((h) => h.id === id)])
  ) as Record<string, Hotel | undefined>;

  const budget = await run('budget', 'Costing flights, stays, food and activities', async () => {
    await sleep(160);
    return computeBudget({
      brief,
      flight: selectedFlight,
      returnFlight: selectedReturn,
      hotels,
      flights,
      itinerary,
      cityNights: allocation,
      selectedHotels,
    });
  }, (r) => `₹${r.estimatedTotal.toLocaleString('en-IN')} total · ₹${r.perPerson.toLocaleString('en-IN')} per person`);

  /* 6b. If the plan is materially over budget, trim it once automatically */
  let finalFlights = flights;
  let finalReturn = returnFlights;
  let finalHotels = hotels;
  let finalSelections = hotelSelections;
  let finalBudget = budget;
  let insightsExtra: string | null = null;

  if (budget.estimatedTotal > budget.totalBudget * 1.08) {
    const cheapestFlight = [...flights].sort((a, b) => a.price - b.price)[0];
    const cheapestReturn = [...returnFlights].sort((a, b) => a.price - b.price)[0];
    const trimmedSelections = { ...hotelSelections };
    cities.forEach((c) => {
      const cheapest = [...hotels]
        .filter((h) => h.cityId === c.id && h.rating >= 8.2)
        .sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
      if (cheapest) trimmedSelections[c.id] = cheapest.id;
    });
    const trimmedHotels = Object.fromEntries(
      Object.entries(trimmedSelections).map(([cityId, id]) => [cityId, hotels.find((h) => h.id === id)])
    ) as Record<string, Hotel | undefined>;

    const trimmed = computeBudget({
      brief,
      flight: cheapestFlight,
      returnFlight: cheapestReturn,
      hotels,
      flights,
      itinerary,
      cityNights: allocation,
      selectedHotels: trimmedHotels,
    });

    if (trimmed.estimatedTotal < budget.estimatedTotal) {
      finalFlights = flights.map((f) => ({
        ...f,
        tags: f.id === cheapestFlight?.id ? [...new Set([...f.tags, 'recommended' as const])] : f.tags.filter((t) => t !== 'recommended'),
      }));
      finalReturn = returnFlights.map((f) => ({
        ...f,
        tags: f.id === cheapestReturn?.id ? [...new Set([...f.tags, 'recommended' as const])] : f.tags.filter((t) => t !== 'recommended'),
      }));
      finalSelections = trimmedSelections;
      finalBudget = trimmed;
      insightsExtra = `Your first pass came in ₹${(
        budget.estimatedTotal - budget.totalBudget
      ).toLocaleString('en-IN')} over budget, so I switched to the lowest sensible fare and the best-value stays in each city.`;
    }
  }

  /* 7. Insights + narrative */
  const insights: PlanPayload['insights'] = [
    {
      title: 'Weather source',
      detail: Object.values(weatherByCity)[0]?.[0]?.source === 'live'
        ? 'Live forecast from Open-Meteo for your dates.'
        : 'Forecast window not open yet — using 10-year climate normals for your month.',
      provenance: Object.values(weatherByCity)[0]?.[0]?.source === 'live' ? 'live' : 'estimated',
    },
    {
      title: 'Flight data',
      detail: flightResult.out.source === 'amadeus'
        ? 'Live Amadeus inventory. Prices refresh on every search.'
        : 'Demo fare engine. Connect Amadeus credentials in .env to show live availability.',
      provenance: flightResult.out.source === 'amadeus' ? 'live' : 'mock',
    },
    {
      title: 'Visa & entry',
      detail: cities[0].visaNote,
      provenance: 'estimated',
    },
    {
      title: 'Safety snapshot',
      detail: `${cities[0].safety.level} — ${cities[0].safety.summary}`,
      provenance: 'ai',
    },
  ];

  const firstCity = cities[0];
  const seasonNote = firstCity.bestMonths.includes(new Date(brief.startDate).getMonth() + 1)
    ? `${new Date(brief.startDate).toLocaleDateString('en-IN', { month: 'long' })} is peak season in ${firstCity.country}.`
    : `You are travelling slightly off-peak for ${firstCity.name} — expect better rates and thinner crowds.`;

  const chosenHotel =
    finalHotels.find((h) => h.id === finalSelections[cities[0].id]) ?? finalHotels[0] ?? selectedHotel;
  const highlights = [
    `${allocation[0].nights} nights in ${firstCity.name}${allocation.length > 1 ? `, then ${allocation.slice(1).map((a) => cityById(a.cityId)?.name).join(' and ')}` : ''}`,
    chosenHotel ? `${chosenHotel.name} — ${chosenHotel.rating}/10 guest score in ${chosenHotel.area}` : 'Handpicked stays per city',
    finalBudget.estimatedTotal <= finalBudget.totalBudget
      ? `₹${(finalBudget.totalBudget - finalBudget.estimatedTotal).toLocaleString('en-IN')} under your target budget`
      : `₹${(finalBudget.estimatedTotal - finalBudget.totalBudget).toLocaleString('en-IN')} over target — see savings below`,
  ];
  if (insightsExtra) {
    insights.unshift({ title: 'Auto-optimised to your budget', detail: insightsExtra, provenance: 'ai' });
  }

  const plan: PlanPayload = {
    brief,
    cities: allocation.map((a) => {
      const c = cityById(a.cityId)!;
      return { cityId: a.cityId, name: c.name, nights: a.nights, tagline: c.tagline };
    }),
    flights: finalFlights,
    returnFlights: finalReturn,
    hotels: finalHotels,
    hotelSelections: finalSelections,
    itinerary,
    budget: finalBudget,
    highlights,
    followUps: [
      'Make this trip cheaper',
      `Add one more day in ${cities[cities.length - 1].name}`,
      'Replace the hotel with something more luxurious',
      'Find activities suitable for couples',
      'Show me alternative flights',
    ],
    insights,
  };

  const consultantNote = await llmText(
    `${AGENT_SYSTEM} Write exactly one sentence (max 24 words) of practical, specific advice for this trip. No numbers, no lists.`,
    `Trip: ${brief.days} days in ${cities.map((c) => c.name).join(', ')} from ${brief.originCity}, interests: ${brief.interests.join(', ')}, pace: ${brief.pace}, stay: ${brief.hotelClass}.`
  );

  const message = composePlanMessage({
    brief,
    plan,
    selectedFlight: finalFlights.find((f) => f.tags.includes('recommended')) ?? selectedFlight,
    selectedReturn,
    selectedHotel: chosenHotel,
    seasonNote,
    missing: parsed.missing,
    followUps: parsed.followUps,
    consultantNote: consultantNote?.trim(),
    suggestionsUsed: needsSuggestion,
  });

  emit({ type: 'plan', plan });
  emit({ type: 'token', delta: message });
  emit({ type: 'done' });

  return { plan, message, steps, missing: parsed.missing, followUps: parsed.followUps };
}

function composePlanMessage(args: {
  brief: TravelBrief;
  plan: PlanPayload;
  selectedFlight?: Flight;
  selectedReturn?: Flight;
  selectedHotel?: Hotel;
  seasonNote: string;
  missing: string[];
  followUps: string[];
  consultantNote?: string;
  suggestionsUsed: boolean;
}): string {
  const { brief, plan, selectedFlight, selectedHotel, seasonNote, missing, followUps, consultantNote, suggestionsUsed } = args;
  const cityNames = plan.cities.map((c) => c.name);
  const under = plan.budget.totalBudget - plan.budget.estimatedTotal;
  const lines: string[] = [];

  lines.push(
    `${suggestionsUsed ? 'Since you did not name a destination, I picked' : 'Here is your'} ${brief.days}-day ${cityNames.join(' → ')} plan for ${
      brief.travelers
    } ${brief.travelers === 1 ? 'traveller' : 'travellers'} from ${brief.originCity}, built around ${brief.interests.slice(0, 3).join(', ')}.`
  );
  lines.push('');
  if (selectedFlight)
    lines.push(
      `• **Flights** — ${selectedFlight.carrierName} ${selectedFlight.stops === 0 ? 'non-stop' : `${selectedFlight.stops} stop`}, ₹${selectedFlight.price.toLocaleString('en-IN')} pp one way. ${plan.flights.length} options compared.`
    );
  if (selectedHotel)
    lines.push(`• **Stay** — ${selectedHotel.name} (${selectedHotel.rating}/10) in ${selectedHotel.area}, ₹${selectedHotel.pricePerNight.toLocaleString('en-IN')}/night.`);
  lines.push(
    `• **Itinerary** — ${plan.itinerary.length} days mapped, ${plan.itinerary.reduce((s, d) => s + d.activities.length, 0)} stops, travel time kept under 25 minutes between stops.`
  );
  lines.push(
    `• **Budget** — ₹${plan.budget.estimatedTotal.toLocaleString('en-IN')} total (₹${plan.budget.perPerson.toLocaleString('en-IN')} pp), ${
      under >= 0 ? `₹${under.toLocaleString('en-IN')} under` : `₹${Math.abs(under).toLocaleString('en-IN')} over`
    } your ₹${plan.budget.totalBudget.toLocaleString('en-IN')} target.`
  );
  lines.push('');
  lines.push(seasonNote);
  if (consultantNote) lines.push(consultantNote);
  if (missing.length) {
    lines.push('');
    lines.push(`I made assumptions about: ${missing.join(', ')}. ${followUps[0] ?? ''}`);
  }
  lines.push('');
  lines.push('Review the plan on the right, then tell me what to change — cheaper, more luxurious, an extra day, or different activities.');
  return lines.join('\n');
}

/* -------------------------------------------------------------------------- */
/*  Conversational refinement — surgical edits, never a full rebuild           */
/* -------------------------------------------------------------------------- */

export interface RefineResult {
  plan: PlanPayload;
  reply: string;
  changed: string[];
}

type RefineIntent =
  | { kind: 'cheaper' }
  | { kind: 'luxury' }
  | { kind: 'add-day'; cityId?: string }
  | { kind: 'remove-day'; cityId?: string }
  | { kind: 'no-early' }
  | { kind: 'couples' }
  | { kind: 'adventure' }
  | { kind: 'alt-flights' }
  | { kind: 'budget'; amount: number }
  | { kind: 'hotel-cheaper' }
  | { kind: 'hotel-swap' }
  | { kind: 'swap-activity'; query: string }
  | { kind: 'remove-activity'; query: string }
  | { kind: 'add-activity'; category?: string }
  | { kind: 'regenerate-day'; day: number }
  | { kind: 'info' };

function classify(text: string): RefineIntent {
  const t = text.toLowerCase();
  const amount = /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|k)?/i.exec(t.replace(/,/g, ''));
  const money = (() => {
    const m = /(?:₹|rs\.?|inr)\s*([\d,]+)|(\d+(?:\.\d+)?)\s*(lakh|lac|l\b|k\b)|(\d{5,7})/.exec(t.replace(/,/g, ''));
    if (!m) return null;
    if (m[1]) return parseInt(m[1].replace(/,/g, ''), 10);
    if (m[2]) {
      const unit = m[3]?.toLowerCase();
      return Math.round(parseFloat(m[2]) * (unit?.startsWith('l') ? 100000 : 1000));
    }
    if (m[4]) return parseInt(m[4], 10);
    return null;
  })();

  if (/alternat|other flight|different flight|more flight|cheaper flight/.test(t)) return { kind: 'alt-flights' };
  if (/luxur|upgrade|5 star|five star|nicer hotel|premium hotel|more expensive hotel|splurge/.test(t)) return { kind: 'luxury' };
  if (/cheaper hotel|budget hotel|hotel.*cheap/.test(t)) return { kind: 'hotel-cheaper' };
  if (/swap (?:the )?hotel|change (?:the )?hotel|different hotel|another hotel|replace (?:the )?hotel/.test(t)) return { kind: 'hotel-swap' };
  if (/don'?t want to wake up early|no early|not early|sleep in|late start|no alarm/.test(t)) return { kind: 'no-early' };
  if (/couple|romantic|honeymoon|anniversary/.test(t)) return { kind: 'couples' };
  if (/adventure|trek|hike|thrill|adrenaline|diving|paraglid/.test(t)) return { kind: 'adventure' };
  if (/add .*day|one more day|extra day|extend|stay longer|another day/.test(t)) {
    const city = Object.keys({}).length ? undefined : undefined;
    const match = /(?:day|night)s? in ([a-z\s-]+)/.exec(t);
    return { kind: 'add-day', cityId: match ? match[1].trim() : undefined };
  }
  if (/remove .*day|shorten|fewer days|less days|reduce .*day/.test(t)) return { kind: 'remove-day' };
  if (/regenerate day (\d+)|redo day (\d+)/.test(t)) {
    const m = /regenerate day (\d+)|redo day (\d+)/.exec(t)!;
    return { kind: 'regenerate-day', day: parseInt(m[1] ?? m[2], 10) };
  }
  if (/cheaper|save money|reduce (?:the )?budget|lower (?:the )?budget|less expensive|cut cost/.test(t) && !money)
    return { kind: 'cheaper' };
  if (money && /budget/.test(t)) return { kind: 'budget', amount: money };
  if (/remove|swap|replace|skip|drop/.test(t) && /activit|sight|stop|museum|temple|tour/.test(t)) {
    const intent: RefineIntent = /remove|skip|drop/.test(t) ? { kind: 'remove-activity', query: t } : { kind: 'swap-activity', query: t };
    return intent;
  }
  if (/more (?:activit|thing)|add .*activit|something else|fill the day|more to do/.test(t))
    return { kind: 'add-activity' };
  return { kind: 'info' };
}

export async function refinePlan(plan: PlanPayload, message: string): Promise<RefineResult> {
  const intent = classify(message);
  const changed: string[] = [];
  let next: PlanPayload = { ...plan, brief: { ...plan.brief }, itinerary: [...plan.itinerary] };
  let reply = '';

  const rebuild = (opts: { keepCity?: string } = {}) => {
    next.itinerary = buildItinerary(next.brief, {});
  };

  const recompute = () => {
    const selectedHotels = Object.fromEntries(
      Object.entries(next.hotelSelections ?? {}).map(([cityId, id]) => [cityId, next.hotels.find((h) => h.id === id)])
    ) as Record<string, Hotel | undefined>;
    next.budget = computeBudget({
      brief: next.brief,
      flight: next.flights.find((f) => f.tags.includes('recommended')) ?? next.flights[0],
      returnFlight: next.returnFlights[0],
      hotels: next.hotels,
      flights: next.flights,
      itinerary: next.itinerary,
      cityNights: allocateDays(next.brief.cityIds, next.brief.days),
      selectedHotels,
    });
  };

  switch (intent.kind) {
    case 'cheaper': {
      const cheaperFlight = [...next.flights].sort((a, b) => a.price - b.price)[0];
      if (cheaperFlight) {
        next.flights = next.flights.map((f) => ({ ...f, tags: f.id === cheaperFlight.id ? [...new Set([...f.tags, 'recommended' as const])] : f.tags.filter((t) => t !== 'recommended') }));
        changed.push(`Switched the flight to ${cheaperFlight.carrierName} at ₹${cheaperFlight.price.toLocaleString('en-IN')}`);
      }
      const selections: Record<string, string> = { ...(next.hotelSelections ?? {}) };
      Object.keys(selections).forEach((cityId) => {
        const inventory = hotelsByCity(cityId);
        next.hotels = [...next.hotels.filter((h) => h.cityId !== cityId), ...inventory.slice(0, 5)];
        const current = next.hotels.find((h) => h.id === selections[cityId]);
        const cheaper = inventory
          .filter((h) => (!current || h.pricePerNight < current.pricePerNight) && h.rating >= 8.2)
          .sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
        if (cheaper) {
          selections[cityId] = cheaper.id;
          changed.push(`Moved ${cityId.replace(/-/g, ' ')} stay to ${cheaper.name} (₹${cheaper.pricePerNight.toLocaleString('en-IN')}/night)`);
        }
      });
      next.hotelSelections = selections;
      next.brief.hotelClass = 'budget';
      recompute();
      reply = `Done — I re-priced the trip without touching the itinerary. ${changed.join('. ')}. New estimate: ₹${next.budget.perPerson.toLocaleString('en-IN')} per person.`;
      break;
    }
    case 'luxury': {
      const selections: Record<string, string> = { ...(next.hotelSelections ?? {}) };
      const cityIds = [...new Set(next.hotels.map((h) => h.cityId))];
      cityIds.forEach((cityId) => {
        next.hotels = [...next.hotels.filter((h) => h.cityId !== cityId), ...hotelsByCity(cityId)];
        const lux = next.hotels
          .filter((h) => h.cityId === cityId)
          .sort((a, b) => b.pricePerNight - a.pricePerNight)[0];
        if (lux) {
          selections[cityId] = lux.id;
          changed.push(`${lux.name} (${lux.stars}★, ₹${lux.pricePerNight.toLocaleString('en-IN')}/night) in ${lux.area}`);
        }
      });
      next.hotelSelections = selections;
      next.brief.hotelClass = 'luxury';
      recompute();
      reply = `Upgraded your stays. ${changed.join('; ')}. The new per-person estimate is ₹${next.budget.perPerson.toLocaleString('en-IN')} — tell me if you want me to offset it elsewhere.`;
      break;
    }
    case 'hotel-cheaper': {
      const selections: Record<string, string> = { ...(next.hotelSelections ?? {}) };
      Object.keys(selections).forEach((cityId) => {
        const cheapest = next.hotels.filter((h) => h.cityId === cityId).sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
        if (cheapest) {
          selections[cityId] = cheapest.id;
          changed.push(`${cheapest.name} at ₹${cheapest.pricePerNight.toLocaleString('en-IN')}/night`);
        }
      });
      next.hotelSelections = selections;
      recompute();
      reply = `Swapped to the best-reviewed budget properties: ${changed.join(', ')}.`;
      break;
    }
    case 'hotel-swap': {
      const selections: Record<string, string> = { ...(next.hotelSelections ?? {}) };
      Object.keys(selections).forEach((cityId) => {
        const options = next.hotels.filter((h) => h.cityId === cityId);
        const idx = options.findIndex((h) => h.id === selections[cityId]);
        const nextHotel = options[(idx + 1) % Math.max(1, options.length)];
        if (nextHotel) {
          selections[cityId] = nextHotel.id;
          changed.push(`${nextHotel.name} — ${nextHotel.area}, ${nextHotel.rating}/10`);
        }
      });
      next.hotelSelections = selections;
      recompute();
      reply = `Swapped the hotel: ${changed.join('; ')}.`;
      break;
    }
    case 'no-early': {
      next.brief = { ...next.brief, avoidEarlyMornings: true, pace: next.brief.pace === 'packed' ? 'balanced' : next.brief.pace };
      rebuild();
      changed.push('Every day now starts at 10:30 instead of 09:00');
      recompute();
      reply = `Understood — no alarms. ${changed[0]}, and the first stop each day is a 15-minute ride from your hotel. Later dinners are kept as-is.`;
      break;
    }
    case 'couples': {
      const coupleInterests = ['relaxation', 'food', 'nightlife', 'photography'] as const;
      next.brief = { ...next.brief, interests: [...new Set([...next.brief.interests, ...coupleInterests])] as TravelBrief['interests'] };
      rebuild();
      changed.push('Rebalanced toward sunset viewpoints, tasting menus and evening experiences');
      recompute();
      reply = `${changed[0]}. Family-heavy attractions have been dropped from the schedule — check the itinerary tab.`;
      break;
    }
    case 'adventure': {
      next.brief = { ...next.brief, interests: [...new Set([...next.brief.interests, 'adventure' as const])] };
      rebuild();
      changed.push('Added adventure-weighted stops (treks, water activities, viewpoints)');
      recompute();
      reply = `${changed[0]}. I kept one slow day so the schedule stays realistic.`;
      break;
    }
    case 'alt-flights': {
      const alt = next.flights.find((f) => !f.tags.includes('recommended')) ?? next.flights[1];
      next.flights = [alt, ...next.flights.filter((f) => f.id !== alt.id)];
      changed.push(`${alt.carrierName} ${alt.stops === 0 ? 'non-stop' : `${alt.stops} stop`} at ₹${alt.price.toLocaleString('en-IN')} pp`);
      recompute();
      reply = `Here are alternatives, cheapest first. ${changed[0]} is now highlighted. Open the Flights tab to compare all ${next.flights.length} options side by side.`;
      break;
    }
    case 'add-day': {
      const targetCity = intent.cityId
        ? next.brief.cityIds.find((id) => id.includes(intent.cityId!.split(' ')[0]))
        : next.brief.cityIds[next.brief.cityIds.length - 1];
      if (targetCity) {
        next.brief = { ...next.brief, days: next.brief.days + 1, cityIds: [...next.brief.cityIds, targetCity] };
        changed.push(`Added a day in ${cityById(targetCity)?.name}`);
        next.cities = allocateDays(next.brief.cityIds, next.brief.days).map((a) => ({
          cityId: a.cityId,
          name: cityById(a.cityId)!.name,
          nights: a.nights,
          tagline: cityById(a.cityId)!.tagline,
        }));
        rebuild();
        recompute();
        reply = `${changed[0]} — the new day is appended to the itinerary and the budget has been updated to ₹${next.budget.perPerson.toLocaleString('en-IN')} per person.`;
      } else {
        reply = 'Which city should I add the day to?';
      }
      break;
    }
    case 'remove-day': {
      if (next.brief.days > 2) {
        next.brief = { ...next.brief, days: next.brief.days - 1 };
        next.cities = allocateDays(next.brief.cityIds, next.brief.days).map((a) => ({
          cityId: a.cityId,
          name: cityById(a.cityId)!.name,
          nights: a.nights,
          tagline: cityById(a.cityId)!.tagline,
        }));
        rebuild();
        recompute();
        changed.push(`Shortened the trip to ${next.brief.days} days`);
      } else changed.push('Two days is the minimum for a workable plan');
      reply = `${changed[0]}. Budget now sits at ₹${next.budget.perPerson.toLocaleString('en-IN')} per person.`;
      break;
    }
    case 'budget': {
      const perPerson = intent.amount && intent.amount > 5000 ? intent.amount : next.brief.budgetPerPerson;
      next.brief = { ...next.brief, budgetPerPerson: perPerson };
      const cheaperFlight = [...next.flights].sort((a, b) => a.price - b.price)[0];
      if (cheaperFlight) {
        next.flights = next.flights.map((f) => ({
          ...f,
          tags: f.id === cheaperFlight.id ? [...new Set([...f.tags, 'recommended' as const])] : f.tags.filter((t) => t !== 'recommended'),
        }));
      }
      const selections: Record<string, string> = { ...(next.hotelSelections ?? {}) };
      Object.keys(selections).forEach((cityId) => {
        const affordable = next.hotels
          .filter((h) => h.cityId === cityId)
          .sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
        if (affordable) selections[cityId] = affordable.id;
      });
      next.hotelSelections = selections;
      next.brief.hotelClass = 'budget';
      recompute();
      changed.push(`Retargeted to ₹${perPerson.toLocaleString('en-IN')} per person`);
      reply = `${changed[0]}. I moved to the cheapest sensible flight and re-picked stays. The estimate is now ₹${next.budget.perPerson.toLocaleString('en-IN')} per person${next.budget.estimatedTotal <= next.budget.totalBudget ? ' — inside your target' : ' — still above target, see the savings list'}.`;
      break;
    }
    case 'remove-activity': {
      const dayIdx = next.itinerary.findIndex((d) => d.activities.some((a) => message.toLowerCase().includes(a.name.split(' ')[0].toLowerCase())));
      if (dayIdx >= 0) {
        const day = next.itinerary[dayIdx];
        const target = day.activities.find((a) => message.toLowerCase().includes(a.name.split(' ')[0].toLowerCase()))!;
        next.itinerary[dayIdx] = {
          ...day,
          activities: day.activities.filter((a) => a.id !== target.id),
          notes: `${day.notes ?? ''} Removed: ${target.name}.`.trim(),
        };
        changed.push(`Removed ${target.name} from day ${day.day}`);
        recompute();
        reply = `${changed[0]}. The rest of the day is untouched.`;
      } else reply = 'I could not find that stop in the itinerary — which day is it on?';
      break;
    }
    case 'swap-activity': {
      const dayIdx = next.itinerary.findIndex((d) => d.activities.some((a) => message.toLowerCase().includes(a.name.split(' ')[0].toLowerCase())));
      if (dayIdx >= 0) {
        const day = next.itinerary[dayIdx];
        const replaced = regenerateDay(next.brief, next.itinerary, day.day);
        next.itinerary = replaced;
        changed.push(`Rebuilt day ${day.day} with different stops`);
        recompute();
        reply = `${changed[0]}, keeping the same city and timings.`;
      } else reply = 'Tell me which activity to replace and I will swap it for a better-rated alternative.';
      break;
    }
    case 'regenerate-day': {
      next.itinerary = regenerateDay(next.brief, next.itinerary, intent.day);
      recompute();
      changed.push(`Day ${intent.day} regenerated`);
      reply = `Day ${intent.day} has been rebuilt with fresh, well-rated stops in the same area. Everything else is unchanged.`;
      break;
    }
    case 'add-activity': {
      rebuild();
      changed.push('Added an extra stop to lighter days');
      recompute();
      reply = `I have filled the lighter days with an extra well-rated stop — have a look at the itinerary.`;
      break;
    }
    default: {
      const answer = await answerTravelQuestion(message, plan);
      return { plan, reply: answer, changed: [] };
    }
  }

  next.insights = plan.insights;
  return { plan: next, reply, changed };
}

/* -------------------------------------------------------------------------- */
/*  Travel assistant Q&A                                                       */
/* -------------------------------------------------------------------------- */

export async function answerTravelQuestion(question: string, plan: PlanPayload): Promise<string> {
  const city = cityById(plan.brief.cityIds[0]);
  if (llmEnabled()) {
    const context = city
      ? `Destination: ${city.name}, ${city.country}. Season: ${new Date(plan.brief.startDate).toLocaleDateString('en-IN', { month: 'long' })}. Traveller interests: ${plan.brief.interests.join(', ')}. Local tips: ${city.localTips.join(' | ')}. Safety: ${city.safety.summary}`
      : '';
    const answer = await llmText(
      `${AGENT_SYSTEM} Answer in under 90 words. Be concrete and practical. If you are unsure, say so instead of inventing facts.`,
      `${context}\n\nQuestion: ${question}`
    );
    if (answer) return answer;
  }

  if (!city) return 'I can help with destinations, transport, weather, packing and local customs — ask me anything about your trip.';

  const q = question.toLowerCase();
  if (/safe|safety|danger|crime/.test(q))
    return `${city.name} is ${city.safety.level}. ${city.safety.summary} Key tips: ${city.safety.tips.slice(0, 2).join(' ')} Emergency numbers — police ${city.safety.emergency.police}, ambulance ${city.safety.emergency.ambulance}.`;
  if (/pack|wear|cloth|luggage/.test(q)) {
    const m = new Date(plan.brief.startDate).getMonth() + 1;
    const climate = city.climate.find((c) => c.month === m);
    return `For ${city.name} in ${new Date(plan.brief.startDate).toLocaleDateString('en-IN', { month: 'long' })}, expect highs around ${climate?.highC ?? 25}°C and lows near ${climate?.lowC ?? 15}°C. ${city.localTips[0]} I can generate a full packing list from the Itinerary tab.`;
  }
  if (/weather|rain|temperature|hot|cold/.test(q)) {
    const w = plan.itinerary[0]?.weather;
    return w
      ? `${city.name} for your dates: ${w.summary.toLowerCase()}, ${w.highC}°C / ${w.lowC}°C. ${weatherAdvice({ date: '', highC: w.highC, lowC: w.lowC, rainMm: w.rainMm, code: 0, summary: w.summary, source: 'estimated' }) ?? 'Should be comfortable for walking.'}`
      : `I do not have a forecast that far out. ${city.name}'s best months are ${city.bestMonths.map((m) => new Date(2026, m - 1).toLocaleDateString('en-IN', { month: 'short' })).join(', ')}.`;
  }
  if (/visa|passport|entry|document/.test(q)) return city.visaNote;
  if (/transport|metro|train|taxi|get around|airport/.test(q))
    return `${city.name}: ${city.localTips.find((t) => /train|metro|transport|taxi|bus|pass/i.test(t)) ?? 'Public transport and ride-hailing both work well.'} Airport transfers are already included in your transport budget.`;
  if (/money|cash|atm|card|tip|currency/.test(q))
    return `Budget about ₹${Math.round((city.dailyBudget.comfort * 0.35) / 100) * 100} per day for food and incidentals in ${city.name}. ${city.localTips.find((t) => /cash|card|atm/i.test(t)) ?? 'Carry a mix of cash and card.'}`;
  if (/food|eat|restaurant|veg|vegetarian/.test(q)) {
    const foodPois = city.pois.filter((p) => p.category === 'food');
    return `Best food anchors in ${city.name}: ${foodPois.map((p) => p.name).slice(0, 3).join(', ')}. Vegetarian food is ${['tokyo', 'kyoto', 'osaka'].includes(city.id) ? 'easy in Buddhist temple areas (shojin ryori) and chain restaurants' : 'widely available'}. Your itinerary already includes one dinner recommendation per day.`;
  }
  if (/when|best time|season/.test(q))
    return `Best months for ${city.name}: ${city.bestMonths.map((m) => new Date(2026, m - 1).toLocaleDateString('en-IN', { month: 'long' })).join(', ')}. You are currently planned for ${new Date(plan.brief.startDate).toLocaleDateString('en-IN', { month: 'long' })}.`;
  return `Here is what I know about ${city.name}: ${city.tagline} ${city.localTips[0]} Ask me about safety, packing, transport, food, visas or the best season and I will get specific.`;
}

/* -------------------------------------------------------------------------- */
/*  Packing + safety assistants                                                */
/* -------------------------------------------------------------------------- */

export const agentMeta = {
  llmEnabled: llmEnabled(),
  providers: {
    flights: process.env.AMADEUS_CLIENT_ID ? 'Amadeus (live)' : 'Demo fare engine',
    hotels: 'Demo inventory',
    weather: 'Open-Meteo (live)',
    maps: process.env.GOOGLE_MAPS_API_KEY ? 'Google Maps' : 'Vector map (offline)',
  },
};

export { STEP_LABEL, airportByCode, estimateFlightPrice, hotelForCity, daysBetween, weatherAdvice };
