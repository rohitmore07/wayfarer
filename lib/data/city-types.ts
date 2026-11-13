import type { Interest, PoiCategory } from '@/lib/types';

export type Slot = 'morning' | 'afternoon' | 'evening' | 'any';

export interface PoiSeed {
  id: string;
  name: string;
  wiki: string;
  category: PoiCategory;
  interests: Interest[];
  area: string;
  lat: number;
  lng: number;
  description: string;
  durationMin?: number;
  costINR?: number;
  rating?: number;
  reviews?: number;
  indoor?: boolean;
  hours?: string;
  bestTime?: Slot;
  tags?: string[];
}

export interface ClimateProfile {
  highs: number[];
  lows: number[];
  rain: number[];
}

export interface CitySeed {
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
  hero: string; // unsplash id or ''
  tagline: string;
  description: string;
  bestMonths: number[];
  dailyBudget: { budget: number; comfort: number; luxury: number };
  hotelNight: { budget: number; comfort: number; luxury: number };
  interests: Interest[];
  climate: ClimateProfile;
  safetyLevel: 'very safe' | 'safe' | 'exercise care';
  safetySummary: string;
  safetyTips: string[];
  emergency: { police: string; ambulance: string; tourist?: string };
  localTips: string[];
  visaNote: string;
  pois: PoiSeed[];
}

export const climatePresets = {
  japan: {
    highs: [10, 11, 14, 19, 23, 26, 30, 31, 27, 22, 17, 12],
    lows: [2, 3, 6, 11, 16, 20, 24, 25, 21, 15, 9, 4],
    rain: [50, 60, 110, 120, 140, 170, 155, 155, 210, 170, 85, 45],
  },
  tropical: {
    highs: [31, 31, 32, 32, 31, 30, 30, 30, 31, 31, 31, 31],
    lows: [24, 24, 24, 25, 24, 24, 23, 23, 24, 24, 24, 24],
    rain: [280, 240, 200, 120, 90, 60, 55, 55, 80, 140, 220, 270],
  },
  monsoonAsia: {
    highs: [33, 34, 36, 37, 35, 33, 32, 32, 32, 32, 32, 32],
    lows: [22, 24, 26, 27, 26, 26, 25, 25, 25, 24, 22, 21],
    rain: [10, 20, 40, 90, 220, 200, 180, 200, 250, 120, 30, 10],
  },
  temperate: {
    highs: [8, 10, 14, 18, 22, 26, 29, 29, 24, 18, 12, 8],
    lows: [2, 3, 6, 9, 13, 16, 19, 18, 15, 10, 6, 3],
    rain: [50, 45, 55, 55, 65, 60, 60, 65, 55, 65, 65, 60],
  },
  alpine: {
    highs: [2, 4, 9, 14, 19, 22, 24, 23, 19, 13, 6, 2],
    lows: [-5, -4, 0, 4, 8, 11, 13, 13, 10, 5, 0, -4],
    rain: [80, 70, 80, 90, 110, 120, 130, 125, 100, 90, 90, 85],
  },
  iceland: {
    highs: [2, 3, 4, 6, 9, 12, 14, 13, 11, 7, 4, 2],
    lows: [-2, -2, -1, 1, 4, 7, 9, 9, 6, 3, 0, -2],
    rain: [75, 70, 75, 60, 55, 55, 65, 75, 90, 95, 85, 80],
  },
  desert: {
    highs: [24, 26, 30, 35, 39, 41, 41, 41, 38, 33, 28, 24],
    lows: [14, 15, 18, 22, 25, 28, 30, 30, 27, 23, 19, 15],
    rain: [20, 25, 20, 8, 2, 0, 2, 2, 1, 3, 8, 18],
  },
  tropicalIsland: {
    highs: [30, 30, 31, 31, 31, 31, 31, 31, 31, 32, 31, 30],
    lows: [24, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24],
    rain: [160, 130, 120, 90, 60, 50, 45, 45, 60, 80, 110, 140],
  },
  indiaNorth: {
    highs: [23, 26, 32, 37, 41, 39, 34, 32, 34, 33, 28, 24],
    lows: [9, 12, 17, 22, 26, 27, 26, 25, 24, 21, 15, 10],
    rain: [10, 8, 8, 8, 15, 60, 200, 190, 80, 15, 5, 5],
  },
  subTropical: {
    highs: [30, 31, 32, 33, 32, 30, 29, 29, 30, 31, 30, 30],
    lows: [22, 23, 24, 25, 25, 24, 24, 24, 24, 24, 23, 22],
    rain: [35, 45, 70, 110, 150, 180, 170, 160, 180, 160, 100, 55],
  },
  mediterranean: {
    highs: [24, 25, 28, 30, 33, 37, 39, 39, 35, 30, 27, 24],
    lows: [18, 19, 22, 25, 29, 33, 35, 35, 32, 28, 23, 19],
    rain: [5, 3, 3, 2, 2, 1, 1, 3, 5, 8, 6, 5],
  },
  northeastUS: {
    highs: [4, 6, 11, 17, 22, 27, 30, 29, 25, 18, 12, 6],
    lows: [-3, -2, 2, 7, 12, 18, 21, 20, 16, 10, 5, -1],
    rain: [80, 75, 90, 95, 90, 90, 100, 95, 85, 85, 85, 85],
  },
} satisfies Record<string, ClimateProfile>;
