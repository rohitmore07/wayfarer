import { AIRPORTS, airportByCode, haversine } from '@/lib/data/airports';
import { carriersFor, airlineByCode } from '@/lib/data/airlines';
import type { Flight, FlightSegment } from '@/lib/types';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  travelers: number;
  cabin: 'economy' | 'premium' | 'business';
  nonStopOnly?: boolean;
  airlines?: string[];
  departWindow?: 'any' | 'morning' | 'afternoon' | 'evening';
}

export interface FlightSearchResult {
  flights: Flight[];
  returnFlights: Flight[];
  source: 'amadeus' | 'mock';
  note: string;
}

/* -------------------------------------------------------------------------- */
/*  Deterministic pseudo-random helpers — same route+date gives same results   */
/* -------------------------------------------------------------------------- */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const CABIN_MULT = { economy: 1, premium: 1.95, business: 3.6 };
const REGION_PEAK: Record<string, number[]> = {
  JP: [3, 4, 10, 11],
  ID: [6, 7, 8, 12],
  VN: [2, 3, 11, 12],
  TH: [11, 12, 1, 2],
  SG: [6, 7, 12],
  FR: [4, 5, 6, 9],
  IS: [6, 7, 8, 2],
  CH: [7, 8, 12, 1],
  AE: [11, 12, 1, 2],
  IN: [10, 11, 12, 5],
  US: [6, 7, 8, 12],
};

const seasonMultiplier = (countryCode: string, date: string) => {
  const month = new Date(date).getMonth() + 1;
  const peak = REGION_PEAK[countryCode] ?? [];
  if (peak.includes(month)) return 1.14;
  if ([1, 2, 9].includes(month)) return 0.95;
  return 1;
};

/** Distance-based fare estimate (INR, per person, one way). */
function estimateFare(distanceKm: number, cabin: Flight['cabin'], carriers = 1, monthMult = 1) {
  const base = 1500 + distanceKm * 3.15;
  const cabinMult = CABIN_MULT[cabin];
  const competition = carriers >= 4 ? 0.92 : carriers >= 2 ? 0.97 : 1.05;
  const season = monthMult;
  return Math.round(((base * cabinMult * competition * season) / 50) * 50);
}

function iso(date: string, hour: number, minute: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function addMinutes(isoStr: string, minutes: number) {
  return new Date(new Date(isoStr).getTime() + minutes * 60000).toISOString();
}

const HUBS: Record<string, string[]> = {
  IN: ['DEL', 'BOM', 'BLR'],
  AE: ['DXB', 'AUH'],
  QA: ['DOH'],
  SG: ['SIN'],
  TH: ['BKK'],
  MY: ['KUL'],
  HK: ['HKG'],
  JP: ['NRT', 'HND'],
};

/**
 * Demo fare generator. Produces realistic-looking options with a deterministic
 * seed so the same search always returns the same itinerary. Clearly labelled
 * as `mock` throughout the UI — never presented as bookable availability.
 */
export function mockFlightSearch(params: FlightSearchParams): FlightSearchResult {
  const origin = airportByCode(params.origin);
  const dest = airportByCode(params.destination);
  if (!origin || !dest) {
    return { flights: [], returnFlights: [], source: 'mock', note: 'Unknown airport code.' };
  }

  const distance = haversine(origin.lat, origin.lng, dest.lat, dest.lng);
  const carriers = carriersFor(origin.country === 'India' ? 'IN' : origin.country.slice(0, 2), dest.country === 'India' ? 'IN' : dest.country.slice(0, 2));
  const monthMult = seasonMultiplier(dest.country === 'India' ? 'IN' : dest.country.slice(0, 2), params.departDate);
  const nonStopPossible = distance < 7000;
  const count = 9;

  const build = (date: string, direction: 'out' | 'ret'): Flight[] => {
    const seed = hash(`${params.origin}-${params.destination}-${date}-${direction}-${params.cabin}`);
    const random = rng(seed);
    const list: Flight[] = [];

    for (let i = 0; i < count; i++) {
      const carrier = carriers[Math.floor(random() * carriers.length)];
      const rawStops = nonStopPossible ? (random() > 0.45 ? 0 : random() > 0.5 ? 1 : 2) : random() > 0.3 ? 1 : 2;
      const stops = params.nonStopOnly ? 0 : rawStops;
      const flightDur = Math.round((45 + (distance / 820) * 60) * 1.06);
      const totalDur = flightDur + stops * (95 + Math.round(random() * 240));
      const depHour = 1 + Math.floor(random() * 22);
      const depMin = [0, 10, 15, 25, 30, 40, 45, 55][Math.floor(random() * 8)];
      const departAt = iso(date, depHour, depMin);
      const arriveAt = addMinutes(departAt, totalDur);

      const cabinPrice = estimateFare(distance, params.cabin, carriers.length, monthMult);
      const stopDiscount = stops === 0 ? 1.12 : stops === 1 ? 1 : 0.86;
      const quickSell = 0.94 + random() * 0.22;
      const price = Math.round((cabinPrice * stopDiscount * quickSell) / 100) * 100;

      const hubPool = HUBS[carrier.regions[0]] ?? ['DXB'];
      const layovers = Array.from({ length: stops }, () => ({
        airport: hubPool[Math.floor(random() * hubPool.length)],
        minutes: 75 + Math.round(random() * 260),
      }));

      const segments: FlightSegment[] = [];
      let cursor = departAt;
      let from = direction === 'out' ? params.origin : params.destination;
      const to = direction === 'out' ? params.destination : params.origin;
      const legs = stops + 1;
      const legMinutes = Math.floor(totalDur / legs) - (stops ? 90 : 0);
      layovers.forEach((l, idx) => {
        segments.push({
          from,
          to: l.airport,
          departAt: cursor,
          arriveAt: addMinutes(cursor, legMinutes),
          carrier: carrier.code,
          carrierName: carrier.name,
          flightNo: `${carrier.code} ${100 + Math.floor(random() * 880)}`,
          durationMin: legMinutes,
        });
        cursor = addMinutes(cursor, legMinutes + l.minutes);
        from = l.airport;
        if (idx === layovers.length - 1) {
          segments.push({
            from: l.airport,
            to,
            departAt: cursor,
            arriveAt: addMinutes(cursor, legMinutes),
            carrier: carrier.code,
            carrierName: carrier.name,
            flightNo: `${carrier.code} ${100 + Math.floor(random() * 880)}`,
            durationMin: legMinutes,
          });
        }
      });
      if (!stops) {
        segments.push({
          from,
          to,
          departAt: cursor,
          arriveAt: addMinutes(cursor, totalDur),
          carrier: carrier.code,
          carrierName: carrier.name,
          flightNo: `${carrier.code} ${100 + Math.floor(random() * 880)}`,
          durationMin: totalDur,
        });
      }

      list.push({
        id: `${direction}-${params.origin}${params.destination}-${date}-${i}`,
        carrier: carrier.code,
        carrierName: carrier.name,
        from: direction === 'out' ? params.origin : params.destination,
        to: direction === 'out' ? params.destination : params.origin,
        departAt,
        arriveAt,
        durationMin: totalDur,
        stops,
        layovers,
        price,
        cabin: params.cabin,
        baggage: {
          cabin: params.cabin === 'economy' ? '7 kg' : '2 × 8 kg',
          checked: stops === 0 ? '25 kg' : '20 kg',
        },
        refundable: random() > 0.7,
        seatsLeft: random() > 0.6 ? 1 + Math.floor(random() * 6) : undefined,
        tags: [],
        segments,
        source: 'mock',
        carbonKg: Math.round(distance * 0.11 * (stops ? 1.18 : 1)),
      });
    }

    return tagFlights(list);
  };

  const flights = build(params.departDate, 'out');
  const returnFlights = params.returnDate ? build(params.returnDate, 'ret') : [];

  return {
    flights: applyFilters(flights, params),
    returnFlights: applyFilters(returnFlights, params),
    source: 'mock',
    note: 'Demo fares generated by the Wayfarer sandbox fare engine. Connect an Amadeus or Duffel key to show live, bookable availability.',
  };
}

function applyFilters(flights: Flight[], params: FlightSearchParams): Flight[] {
  let out = flights;
  if (params.nonStopOnly) out = out.filter((f) => f.stops === 0);
  if (params.airlines?.length) out = out.filter((f) => params.airlines!.includes(f.carrier));
  if (params.departWindow && params.departWindow !== 'any') {
    const hour = (f: Flight) => new Date(f.departAt).getHours();
    out = out.filter((f) =>
      params.departWindow === 'morning'
        ? hour(f) < 12
        : params.departWindow === 'afternoon'
          ? hour(f) >= 12 && hour(f) < 18
          : hour(f) >= 18
    );
  }
  return out.sort((a, b) => a.price - b.price);
}

export function tagFlights(flights: Flight[]): Flight[] {
  if (!flights.length) return flights;
  const cheapest = flights.reduce((a, b) => (a.price <= b.price ? a : b));
  const fastest = flights.reduce((a, b) => (a.durationMin <= b.durationMin ? a : b));

  // Recommended = price + duration + carrier quality + convenience
  const scored = [...flights]
    .map((f) => {
      const priceScore = 1 - (f.price - cheapest.price) / (cheapest.price * 1.4 || 1);
      const timeScore = 1 - (f.durationMin - fastest.durationMin) / (fastest.durationMin * 0.8 || 1);
      const quality = (airlineByCode(f.carrier)?.rating ?? 4) / 5;
      const convenience = f.stops === 0 ? 1 : f.stops === 1 ? 0.72 : 0.4;
      const hour = new Date(f.departAt).getHours();
      const humane = hour >= 6 && hour <= 21 ? 1 : 0.82;
      return { f, score: priceScore * 0.42 + timeScore * 0.18 + quality * 0.2 + convenience * 0.15 + humane * 0.05 };
    })
    .sort((a, b) => b.score - a.score);
  const recommended = scored[0].f;

  return flights.map((f) => ({
    ...f,
    tags: [
      ...(f.id === cheapest.id ? (['cheapest'] as const) : []),
      ...(f.id === fastest.id ? (['fastest'] as const) : []),
      ...(f.id === recommended.id ? (['recommended'] as const) : []),
      ...(f.price < cheapest.price * 1.12 && f.stops === 0 && f.id !== recommended.id ? (['best-value'] as const) : []),
    ],
  }));
}

/* -------------------------------------------------------------------------- */
/*  Amadeus adapter — activated when credentials are present                   */
/* -------------------------------------------------------------------------- */

let amadeusToken: { token: string; expires: number } | null = null;

async function getAmadeusToken(): Promise<string | null> {
  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (amadeusToken && amadeusToken.expires > Date.now() + 30000) return amadeusToken.token;
  const host = process.env.AMADEUS_HOST ?? 'https://test.api.amadeus.com';
  const res = await fetch(`${host}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  amadeusToken = { token: json.access_token, expires: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export async function amadeusFlightSearch(params: FlightSearchParams): Promise<FlightSearchResult | null> {
  const token = await getAmadeusToken();
  if (!token) return null;
  const host = process.env.AMADEUS_HOST ?? 'https://test.api.amadeus.com';
  const cabinMap = { economy: 'ECONOMY', premium: 'PREMIUM_ECONOMY', business: 'BUSINESS' };
  const qs = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departDate,
    adults: String(Math.max(1, params.travelers)),
    travelClass: cabinMap[params.cabin],
    currencyCode: 'INR',
    max: '20',
    nonStop: params.nonStopOnly ? 'true' : 'false',
  });
  if (params.returnDate) qs.set('returnDate', params.returnDate);

  const res = await fetch(`${host}/v2/shopping/flight-offers?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  const dictionaries = json.dictionaries ?? {};

  const mapOffer = (offer: any, idx: number, direction: 'out' | 'ret'): Flight => {
    const itin = offer.itineraries[direction === 'out' ? 0 : 1] ?? offer.itineraries[0];
    const first = itin.segments[0];
    const last = itin.segments[itin.segments.length - 1];
    const carrier = first.carrierCode;
    const price = Math.round(parseFloat(offer.price.grandTotal) / Math.max(1, params.travelers));
    return {
      id: `${direction}-${offer.id}-${idx}`,
      carrier,
      carrierName: dictionaries.carriers?.[carrier] ?? carrier,
      from: first.departure.iataCode,
      to: last.arrival.iataCode,
      departAt: first.departure.at,
      arriveAt: last.arrival.at,
      durationMin: parseDuration(itin.duration),
      stops: itin.segments.length - 1,
      layovers: itin.segments.slice(0, -1).map((s: any) => ({
        airport: s.arrival.iataCode,
        minutes: Math.round((new Date(s.arrival.at).getTime() - new Date(s.departure.at).getTime()) / 60000),
      })),
      price,
      cabin: params.cabin,
      baggage: {
        cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCabinBags?.quantity ? '1 bag' : '1 bag',
        checked: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.weight
          ? `${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.weight} ${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.weightUnit ?? 'kg'}`
          : 'Check fare rules',
      },
      refundable: false,
      tags: [],
      segments: itin.segments.map((s: any) => ({
        from: s.departure.iataCode,
        to: s.arrival.iataCode,
        departAt: s.departure.at,
        arriveAt: s.arrival.at,
        carrier: s.carrierCode,
        carrierName: dictionaries.carriers?.[s.carrierCode] ?? s.carrierCode,
        flightNo: `${s.carrierCode} ${s.number}`,
        durationMin: parseDuration(s.duration),
      })),
      source: 'live',
      bookingUrl: `https://www.google.com/travel/flights?q=Flights%20from%20${first.departure.iataCode}%20to%20${last.arrival.iataCode}`,
    };
  };

  const flights = (json.data ?? []).map((o: any, i: number) => mapOffer(o, i, 'out'));
  const returnFlights = params.returnDate
    ? (json.data ?? []).filter((o: any) => o.itineraries.length > 1).map((o: any, i: number) => mapOffer(o, i, 'ret'))
    : [];

  return {
    flights: tagFlights(applyFilters(flights, params)),
    returnFlights: tagFlights(applyFilters(returnFlights, params)),
    source: 'amadeus',
    note: 'Live inventory via Amadeus Self-Service API.',
  };
}

function parseDuration(iso: string): number {
  const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(iso ?? '');
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 1440) + parseInt(m[2] ?? '0') * 60 + parseInt(m[3] ?? '0');
}

/** Public entry point: try live provider first, fall back to the demo engine. */
export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
  try {
    const live = await amadeusFlightSearch(params);
    if (live && live.flights.length) return live;
  } catch (err) {
    console.warn('[flights] live provider failed, using demo engine:', (err as Error).message);
  }
  return mockFlightSearch(params);
}

/** Direct-flight destinations used by the destination finder. */
export function reachableDestinations(origin: string) {
  const o = airportByCode(origin);
  if (!o) return AIRPORTS;
  return AIRPORTS.filter((a) => a.code !== origin && haversine(o.lat, o.lng, a.lat, a.lng) < 9500);
}

export function estimateFlightPrice(origin: string, destination: string, cabin: Flight['cabin'] = 'economy') {
  const o = airportByCode(origin);
  const d = airportByCode(destination);
  if (!o || !d) return 0;
  return estimateFare(haversine(o.lat, o.lng, d.lat, d.lng), cabin);
}
