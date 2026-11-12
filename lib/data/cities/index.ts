import type { City, Interest, Poi } from '@/lib/types';
import imagesJson from '../images.json';
import { asiaCities } from './asia';
import { europeCities } from './europe';
import { japanCities } from './japan';
import { restCities } from './rest';
import type { CitySeed, PoiSeed } from '../city-types';
import { unsplash, PHOTOS } from '../unsplash';

const WIKI_IMAGES = imagesJson as Record<string, string>;

const CATEGORY_FALLBACK: Record<string, string> = {
  attraction: PHOTOS.kyoto,
  museum: PHOTOS.europeStreet,
  nature: PHOTOS.nature,
  adventure: PHOTOS.hike,
  food: PHOTOS.izakaya,
  shopping: PHOTOS.shibuya,
  nightlife: PHOTOS.tokyoNight,
  experience: PHOTOS.lanterns,
  viewpoint: PHOTOS.tokyoTower,
};

export const cityHero = (seed: CitySeed): string => {
  if (seed.hero) return unsplash(seed.hero, 1800);
  if (WIKI_IMAGES[seed.id]) return WIKI_IMAGES[seed.id];
  return unsplash(PHOTOS.japanFuji, 1800);
};

const poiImage = (poi: PoiSeed, city: CitySeed): string => {
  const wiki = WIKI_IMAGES[poi.id];
  if (wiki) return wiki;
  if (city.hero) return unsplash(city.hero, 1200);
  return unsplash(CATEGORY_FALLBACK[poi.category] ?? PHOTOS.nature, 1200);
};

const toPoi = (p: PoiSeed, city: CitySeed): Poi => ({
  id: p.id,
  name: p.name,
  cityId: city.id,
  category: p.category,
  interests: p.interests,
  area: p.area,
  lat: p.lat,
  lng: p.lng,
  durationMin: p.durationMin ?? 90,
  costINR: p.costINR ?? 0,
  rating: p.rating ?? 4.4,
  reviews: p.reviews ?? 4200,
  indoor: p.indoor ?? false,
  description: p.description,
  hours: p.hours ?? '09:00–17:00',
  bestTime: p.bestTime ?? 'any',
  image: poiImage(p, city),
  tags: p.tags ?? [],
});

const toCity = (seed: CitySeed): City => {
  const city: City = {
    id: seed.id,
    name: seed.name,
    country: seed.country,
    countryCode: seed.countryCode,
    region: seed.region,
    currency: seed.currency,
    timezone: seed.timezone,
    lat: seed.lat,
    lng: seed.lng,
    airportCode: seed.airportCode,
    heroImage: cityHero(seed),
    gallery: [],
    tagline: seed.tagline,
    description: seed.description,
    bestMonths: seed.bestMonths,
    dailyBudget: seed.dailyBudget,
    hotelNight: seed.hotelNight,
    interests: seed.interests,
    climate: seed.climate.highs.map((highC, i) => ({
      month: i + 1,
      highC,
      lowC: seed.climate.lows[i],
      rainMm: seed.climate.rain[i],
    })),
    safety: {
      level: seed.safetyLevel,
      summary: seed.safetySummary,
      tips: seed.safetyTips,
      emergency: seed.emergency,
    },
    localTips: seed.localTips,
    visaNote: seed.visaNote,
    pois: seed.pois.map((p) => toPoi(p, seed)),
  };
  city.gallery = city.pois.slice(0, 4).map((p) => p.image);
  return city;
};

export const CITIES: City[] = [...japanCities, ...asiaCities, ...europeCities, ...restCities].map(toCity);

export const cityById = (id: string) => CITIES.find((c) => c.id === id);
export const cityByName = (name: string) =>
  CITIES.find((c) => c.name.toLowerCase() === name.toLowerCase()) ??
  CITIES.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));

export const ALL_POIS: Poi[] = CITIES.flatMap((c) => c.pois);
export const poiById = (id: string) => ALL_POIS.find((p) => p.id === id);

export const CITY_ALIASES: Record<string, string> = {
  tokyo: 'tokyo',
  kyoto: 'kyoto',
  osaka: 'osaka',
  japan: 'tokyo',
  bali: 'bali',
  ubud: 'bali',
  seminyak: 'bali',
  indonesia: 'bali',
  hanoi: 'hanoi',
  'ha long': 'hanoi',
  vietnam: 'hanoi',
  'hoi an': 'hoi-an',
  hoian: 'hoi-an',
  'da nang': 'hoi-an',
  bangkok: 'bangkok',
  thailand: 'bangkok',
  phuket: 'bangkok',
  singapore: 'singapore',
  paris: 'paris',
  france: 'paris',
  reykjavik: 'reykjavik',
  iceland: 'reykjavik',
  interlaken: 'interlaken',
  switzerland: 'interlaken',
  swiss: 'interlaken',
  jungfrau: 'interlaken',
  zurich: 'interlaken',
  dubai: 'dubai',
  uae: 'dubai',
  jaipur: 'jaipur',
  rajasthan: 'jaipur',
  udaipur: 'udaipur',
  kerala: 'kerala',
  alleppey: 'kerala',
  munnar: 'kerala',
  kochi: 'kerala',
  'new york': 'new-york',
  nyc: 'new-york',
  'new york city': 'new-york',
  usa: 'new-york',
  america: 'new-york',
};

/** Fuzzy destination resolution used by the agent intent parser. */
export function resolveCityId(token: string): string | null {
  const t = token.trim().toLowerCase();
  if (!t) return null;
  if (CITY_ALIASES[t]) return CITY_ALIASES[t];
  const direct = CITIES.find((c) => c.id === t || c.name.toLowerCase() === t);
  if (direct) return direct.id;
  for (const [alias, id] of Object.entries(CITY_ALIASES)) {
    if (t.includes(alias)) return id;
  }
  const partial = CITIES.find((c) => t.includes(c.name.toLowerCase()));
  return partial ? partial.id : null;
}

export function citiesByInterest(interests: Interest[]): City[] {
  if (!interests.length) return CITIES;
  return [...CITIES].sort((a, b) => {
    const score = (c: City) => interests.filter((i) => c.interests.includes(i)).length;
    return score(b) - score(a);
  });
}

export const REGION_LABEL: Record<City['region'], string> = {
  asia: 'Asia',
  europe: 'Europe',
  'middle-east': 'Middle East',
  americas: 'Americas',
  oceania: 'Oceania',
  africa: 'Africa',
};
