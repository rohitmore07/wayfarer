import { HOTELS, hotelsByCity } from '@/lib/data/hotels';
import { cityById } from '@/lib/data/cities';
import type { Hotel, HotelClass, Poi } from '@/lib/types';
import { haversine } from '@/lib/data/airports';

export interface HotelSearchParams {
  cityId: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  tier?: HotelClass | 'any';
  minRating?: number;
  maxPrice?: number;
  amenities?: string[];
  propertyTypes?: Hotel['propertyType'][];
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'rating';
}

export interface HotelSearchResultItem extends Hotel {
  score: number;
  reasons: string[];
}

export const AMENITY_FILTERS = [
  'Free Wi-Fi',
  'Breakfast',
  'Pool',
  'Spa',
  'Gym',
  'Bar',
  'Rooftop',
  'Onsen bath',
  'Beachfront',
  'Kitchen',
  'Airport shuttle',
  'Kids club',
];

export const PROPERTY_TYPES: { id: Hotel['propertyType']; label: string }[] = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'ryokan', label: 'Ryokan' },
  { id: 'resort', label: 'Resort' },
  { id: 'villa', label: 'Villa' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'hostel', label: 'Guesthouse' },
];

/**
 * Hotel recommendation engine.
 * Scores each property on price fit, guest rating, tier match and — crucially —
 * how close it sits to the attractions the itinerary actually visits.
 */
export function searchHotels(params: HotelSearchParams, anchorPois: Poi[] = []): HotelSearchResultItem[] {
  const city = cityById(params.cityId);
  let list = hotelsByCity(params.cityId).map((h) => ({ ...h }));

  if (params.tier && params.tier !== 'any') list = list.filter((h) => h.tier === params.tier);
  if (params.minRating) list = list.filter((h) => h.rating >= (params.minRating ?? 0));
  if (params.maxPrice) list = list.filter((h) => h.pricePerNight <= params.maxPrice!);
  if (params.propertyTypes?.length) list = list.filter((h) => params.propertyTypes!.includes(h.propertyType));
  if (params.amenities?.length)
    list = list.filter((h) => params.amenities!.every((a) => h.amenities.some((x) => x.toLowerCase().includes(a.toLowerCase()))));

  const anchors = anchorPois.length ? anchorPois : (city?.pois.slice(0, 4) ?? []);
  const targetNight = city ? city.hotelNight : { budget: 4000, comfort: 9000, luxury: 22000 };
  const idealPrice =
    params.tier === 'luxury' ? targetNight.luxury : params.tier === 'budget' ? targetNight.budget : targetNight.comfort;

  const scored: HotelSearchResultItem[] = list.map((h) => {
    const reasons: string[] = [];
    const priceDiff = Math.abs(h.pricePerNight - idealPrice) / idealPrice;
    const priceScore = Math.max(0, 1 - priceDiff) * 30;
    if (priceDiff < 0.25) reasons.push('Fits your nightly budget');

    const ratingScore = ((h.rating - 7.5) / 2) * 25;
    if (h.rating >= 9.2) reasons.push(`Exceptional guest score (${h.rating})`);

    const distances = anchors.map((p) => haversine(h.lat, h.lng, p.lat, p.lng));
    const avgKm = distances.reduce((a, b) => a + b, 0) / (distances.length || 1);
    const locationScore = Math.max(0, 1 - avgKm / 12) * 28;
    if (avgKm < 3) reasons.push(`Walks to ${anchors[0]?.name ?? 'the old town'}`);

    const tierMatch = params.tier && params.tier !== 'any' ? (h.tier === params.tier ? 12 : 0) : 8;
    const valueScore = Math.min(10, (h.rating / h.pricePerNight) * 4000);

    if (h.amenities.includes('Breakfast')) reasons.push('Breakfast included');
    if (h.amenities.includes('Pool')) reasons.push('Pool on site');

    return {
      ...h,
      score: Math.round((priceScore + ratingScore + locationScore + tierMatch + valueScore) * 10) / 10,
      reasons: reasons.slice(0, 3),
    };
  });

  const sort = params.sort ?? 'recommended';
  scored.sort((a, b) =>
    sort === 'price-asc'
      ? a.pricePerNight - b.pricePerNight
      : sort === 'price-desc'
        ? b.pricePerNight - a.pricePerNight
        : sort === 'rating'
          ? b.rating - a.rating
          : b.score - a.score
  );
  return scored;
}

export function hotelForCity(cityId: string, tier: HotelClass): Hotel | undefined {
  const matches = HOTELS.filter((h) => h.cityId === cityId && h.tier === tier);
  if (matches.length) return [...matches].sort((a, b) => b.rating - a.rating)[0];
  const fallback = hotelsByCity(cityId).sort((a, b) => b.rating - a.rating)[0];
  return fallback;
}

export const hotelSourceNote =
  'Demo hotel inventory — fictional properties with realistic pricing, used to demonstrate the recommendation engine. Swap lib/providers/hotels.ts for a live bedbank (Booking.com, Expedia, Hotelbeds) to return real availability.';
