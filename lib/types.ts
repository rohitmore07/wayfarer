/**
 * Wayfarer AI — domain model.
 * Every piece of data that reaches the UI carries a `Provenance` tag so we never
 * present a mock price as a live one (see section 12 of the product spec).
 */

export type Provenance = 'live' | 'estimated' | 'ai' | 'mock';

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  live: 'Live data',
  estimated: 'Estimated',
  ai: 'AI recommendation',
  mock: 'Demo data',
};

export type Interest =
  | 'culture'
  | 'food'
  | 'nature'
  | 'adventure'
  | 'nightlife'
  | 'shopping'
  | 'art'
  | 'history'
  | 'photography'
  | 'relaxation'
  | 'family'
  | 'anime';

export type HotelClass = 'budget' | 'comfort' | 'luxury';
export type Pace = 'relaxed' | 'balanced' | 'packed';

export interface TravelBrief {
  originCity: string;
  originCode: string;
  destinationQuery: string;
  cityIds: string[];
  startDate: string; // ISO yyyy-mm-dd
  days: number;
  travelers: number;
  budgetPerPerson: number; // INR
  interests: Interest[];
  hotelClass: HotelClass;
  pace: Pace;
  avoidEarlyMornings: boolean;
  cabin?: 'economy' | 'premium' | 'business';
  notes?: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
}

export interface FlightSegment {
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  carrier: string;
  carrierName: string;
  flightNo: string;
  durationMin: number;
}

export interface Flight {
  id: string;
  carrier: string;
  carrierName: string;
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  durationMin: number;
  stops: number;
  layovers: { airport: string; minutes: number }[];
  price: number; // per traveller, INR
  cabin: 'economy' | 'premium' | 'business';
  baggage: { cabin: string; checked: string };
  refundable: boolean;
  seatsLeft?: number;
  tags: ('cheapest' | 'fastest' | 'recommended' | 'best-value')[];
  segments: FlightSegment[];
  source: Provenance;
  bookingUrl?: string;
  carbonKg?: number;
}

export interface RoomType {
  name: string;
  price: number;
  sleeps: number;
  breakfast: boolean;
  refundable: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  cityId: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  stars: number;
  rating: number; // guest score /10
  reviewCount: number;
  pricePerNight: number; // INR
  propertyType: 'hotel' | 'ryokan' | 'resort' | 'apartment' | 'villa' | 'hostel' | 'ryad';
  tier: HotelClass;
  amenities: string[];
  images: string[];
  description: string;
  distanceToCenterKm: number;
  nearby: { name: string; km: number }[];
  rooms: RoomType[];
  cancellation: string;
  source: Provenance;
}

export type PoiCategory =
  | 'attraction'
  | 'museum'
  | 'nature'
  | 'adventure'
  | 'food'
  | 'shopping'
  | 'nightlife'
  | 'experience'
  | 'viewpoint';

export interface Poi {
  id: string;
  name: string;
  cityId: string;
  category: PoiCategory;
  interests: Interest[];
  area: string;
  lat: number;
  lng: number;
  durationMin: number;
  costINR: number;
  rating: number;
  reviews: number;
  indoor: boolean;
  description: string;
  hours: string;
  bestTime: 'morning' | 'afternoon' | 'evening' | 'any';
  image: string;
  bookingUrl?: string;
  tags: string[];
}

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: 'asia' | 'europe' | 'middle-east' | 'americas' | 'oceania' | 'africa';
  currency: string;
  timezone: string;
  lat: number;
  lng: number;
  airportCode: string;
  heroImage: string;
  gallery: string[];
  tagline: string;
  description: string;
  bestMonths: number[];
  dailyBudget: { budget: number; comfort: number; luxury: number }; // per person, INR, excl. flights & hotels
  hotelNight: { budget: number; comfort: number; luxury: number };
  interests: Interest[];
  climate: { month: number; highC: number; lowC: number; rainMm: number }[];
  safety: { level: 'very safe' | 'safe' | 'exercise care'; summary: string; tips: string[]; emergency: { police: string; ambulance: string; tourist?: string } };
  localTips: string[];
  visaNote: string;
  pois: Poi[];
}

export interface DayActivity {
  id: string;
  poiId: string;
  name: string;
  cityId: string;
  slot: 'morning' | 'afternoon' | 'evening';
  startTime: string; // "09:30"
  durationMin: number;
  costINR: number;
  category: PoiCategory;
  area: string;
  lat: number;
  lng: number;
  description: string;
  image: string;
  transport?: { mode: 'walk' | 'metro' | 'taxi' | 'train' | 'ferry'; minutes: number; costINR: number; note: string };
  meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  locked?: boolean;
  provenance: Provenance;
}

export interface ItineraryDay {
  day: number;
  date: string; // ISO
  cityId: string;
  cityName: string;
  title: string;
  summary: string;
  activities: DayActivity[];
  dailyCostINR: number;
  weather?: { highC: number; lowC: number; rainMm: number; summary: string; source: Provenance };
  notes?: string;
}

export interface BudgetCategory {
  key: 'flights' | 'stay' | 'food' | 'transport' | 'activities' | 'shopping' | 'misc';
  label: string;
  perPerson: number;
  total: number;
  note?: string;
  provenance: Provenance;
}

export interface BudgetPlan {
  currency: 'INR';
  totalBudget: number;
  estimatedTotal: number;
  perPerson: number;
  categories: BudgetCategory[];
  daily?: number;
  warnings: string[];
  savings: { title: string; detail: string; savingINR: number }[];
  provenance: Provenance;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  subtitle: string;
  status: 'draft' | 'upcoming' | 'past';
  createdAt: string;
  updatedAt: string;
  brief: TravelBrief;
  coverImage: string;
  startDate: string;
  endDate: string;
  travelers: number;
  cities: { cityId: string; name: string; nights: number }[];
  flights: Flight[];
  selectedFlightId?: string;
  returnFlight?: Flight | null;
  hotels: Hotel[];
  selectedHotelId?: string;
  hotelSelections: Record<string, string>;
  itinerary: ItineraryDay[];
  budget: BudgetPlan;
  sources: { label: string; provenance: Provenance; detail: string }[];
  bookingRefs: { type: 'flight' | 'hotel' | 'activity'; label: string; ref: string; status: 'confirmed' | 'pending' }[];
  packingList?: PackingGroup[];
  messages: ChatMessage[];
  savedActivityIds: string[];
  isSample?: boolean;
}

export interface PackingGroup {
  title: string;
  items: { label: string; packed?: boolean }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  steps?: AgentStep[];
  plan?: PlanPayload;
  intent?: string;
}

export interface AgentStep {
  id: string;
  label: string;
  agent: 'planner' | 'destination' | 'flight' | 'hotel' | 'itinerary' | 'budget' | 'weather' | 'safety';
  status: 'pending' | 'running' | 'done' | 'skipped' | 'error';
  detail?: string;
  ms?: number;
}

export interface PlanPayload {
  brief: TravelBrief;
  cities: { cityId: string; name: string; nights: number; tagline: string }[];
  flights: Flight[];
  returnFlights: Flight[];
  hotels: Hotel[];
  hotelSelections: Record<string, string>;
  itinerary: ItineraryDay[];
  budget: BudgetPlan;
  highlights: string[];
  followUps: string[];
  insights: { title: string; detail: string; provenance: Provenance }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  avatarColor: string;
  homeCity: string;
  homeAirport: string;
  preferences: {
    interests: Interest[];
    hotelClass: HotelClass;
    pace: Pace;
    currency: 'INR';
    dietary?: string;
  };
  savedDestinations: string[];
  savedHotels: string[];
  savedFlights: string[];
  savedActivities: string[];
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}
