import { CITIES } from '@/lib/data/cities';
import { estimateFlightPrice } from '@/lib/providers/flights';
import type { City, Interest } from '@/lib/types';

export interface DestinationMatch {
  city: City;
  score: number;
  estimatedTotalPerPerson: number;
  withinBudget: boolean;
  reasons: string[];
  suggestedNights: number;
}

export interface FinderCriteria {
  budgetPerPerson: number;
  days: number;
  month?: number; // 1-12
  interests?: Interest[];
  region?: City['region'] | 'any';
  originCode?: string;
  climate?: 'warm' | 'cool' | 'any';
}

/**
 * AI Destination Finder — scores the catalogue against budget, season and
 * interests. All numbers are transparent estimates the UI can show.
 */
export function findDestinations(criteria: FinderCriteria): DestinationMatch[] {
  const { budgetPerPerson, days, month, interests = [], region = 'any', originCode = 'BOM' } = criteria;
  const nights = Math.max(1, days - 1);

  const matches: DestinationMatch[] = CITIES.filter((c) => region === 'any' || c.region === region).map((city) => {
    const flight = estimateFlightPrice(originCode, city.airportCode);
    const hotel = city.hotelNight.comfort * nights * 1; // per person share of a double
    const daily = city.dailyBudget.comfort * days;
    const estimatedTotalPerPerson = Math.round(flight * 2 + hotel / 2 + daily);

    const reasons: string[] = [];
    let score = 0;

    // budget fit (40)
    const ratio = budgetPerPerson / Math.max(1, estimatedTotalPerPerson);
    if (ratio >= 1) {
      score += 40;
      reasons.push(`Fits your ₹${budgetPerPerson.toLocaleString('en-IN')} budget with room to spare`);
    } else if (ratio > 0.85) {
      score += 26;
      reasons.push('Just inside budget with careful choices');
    } else {
      score += Math.max(0, 22 * ratio);
    }

    // interests (35)
    const overlap = interests.filter((i) => city.interests.includes(i));
    score += Math.min(35, overlap.length * 11);
    if (overlap.length >= 2) reasons.push(`Strong on ${overlap.slice(0, 3).join(', ')}`);

    // season (15)
    if (month) {
      const climate = city.climate.find((c) => c.month === month);
      const inBest = city.bestMonths.includes(month);
      if (inBest) {
        score += 15;
        reasons.push('Peak season — best weather of the year');
      } else if (climate) {
        const rainy = climate.rainMm > 180;
        const extreme = climate.highC > 40 || climate.lowC < -8;
        score += rainy || extreme ? 2 : 9;
        if (rainy) reasons.push('Expect monsoon-level rain in this month');
        if (extreme) reasons.push('Extreme temperatures this month');
      }
      if (criteria.climate === 'warm' && climate && climate.highC >= 24) score += 4;
      if (criteria.climate === 'cool' && climate && climate.highC <= 22) score += 4;
    }

    // trip length fit (10)
    const ideal = city.pois.length >= 8 ? 5 : 4;
    score += days >= 3 && days <= ideal + 3 ? 10 : 4;

    return {
      city,
      score: Math.round(Math.min(99, score)),
      estimatedTotalPerPerson,
      withinBudget: estimatedTotalPerPerson <= budgetPerPerson,
      reasons: reasons.slice(0, 3),
      suggestedNights: Math.min(nights, ideal),
    };
  });

  return matches.sort((a, b) => b.score - a.score);
}

export const INTEREST_LABELS: Record<Interest, string> = {
  culture: 'Culture',
  food: 'Food',
  nature: 'Nature',
  adventure: 'Adventure',
  nightlife: 'Nightlife',
  shopping: 'Shopping',
  art: 'Art & design',
  history: 'History',
  photography: 'Photography',
  relaxation: 'Relaxation',
  family: 'Family',
  anime: 'Anime & pop culture',
};

export const DESTINATION_PROMPTS = [
  'Japan in March, 7 days, ₹1.5L per person, culture and food',
  'A quiet beach trip in November under ₹60,000',
  'Europe in May for 10 days, art and food, ₹2.5L',
  'Rajasthan long weekend from Mumbai for 4 days',
  'Somewhere cold with aurora, 5 days, ₹2L',
];
