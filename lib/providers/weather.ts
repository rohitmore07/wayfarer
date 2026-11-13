import { cityById } from '@/lib/data/cities';
import type { City } from '@/lib/types';

export interface WeatherDay {
  date: string;
  highC: number;
  lowC: number;
  rainMm: number;
  code: number;
  summary: string;
  source: 'live' | 'estimated';
}

/** WMO weather interpretation codes → short human strings. */
const WMO: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
};

const summarise = (code: number) => WMO[code] ?? 'Mixed conditions';

/**
 * Open-Meteo is used because it needs no API key and is genuinely live.
 * Forecasts only cover ~16 days, so far-out dates fall back to 10-year
 * climate normals from the destination dataset (clearly labelled estimated).
 */
export async function getWeather(cityId: string, startDate: string, days: number): Promise<WeatherDay[]> {
  const city = cityById(cityId);
  if (!city) return [];
  const start = new Date(startDate);
  const today = new Date();
  const dayDiff = Math.round((start.getTime() - today.getTime()) / 86400000);
  const forecastable = dayDiff >= -1 && dayDiff <= 15;

  if (forecastable) {
    try {
      const end = new Date(start.getTime() + (Math.min(days, 16) - 1) * 86400000);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
        `&timezone=auto&start_date=${fmt(start)}&end_date=${fmt(end)}`;
      const res = await fetch(url, { cache: 'force-cache' } as RequestInit);
      if (res.ok) {
        const json: any = await res.json();
        const out: WeatherDay[] = (json.daily?.time ?? []).map((d: string, i: number) => ({
          date: d,
          highC: Math.round(json.daily.temperature_2m_max[i]),
          lowC: Math.round(json.daily.temperature_2m_min[i]),
          rainMm: Math.round(json.daily.precipitation_sum[i] ?? 0),
          code: json.daily.weathercode[i] ?? 0,
          summary: summarise(json.daily.weathercode[i] ?? 0),
          source: 'live',
        }));
        if (out.length) return out;
      }
    } catch (err) {
      console.warn('[weather] live forecast failed:', (err as Error).message);
    }
  }
  return climateNormals(city, start, days);
}

export function climateNormals(city: City, start: Date, days: number): WeatherDay[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * 86400000);
    const month = city.climate.find((c) => c.month === d.getMonth() + 1) ?? city.climate[0];
    const seasonalRain = month.rainMm;
    return {
      date: d.toISOString().slice(0, 10),
      highC: month.highC,
      lowC: month.lowC,
      rainMm: seasonalRain,
      code: seasonalRain > 150 ? 61 : seasonalRain > 80 ? 80 : 1,
      summary: seasonalRain > 150 ? 'Wet season — expect afternoon showers' : seasonalRain > 80 ? 'Mixed, carry a light rain jacket' : 'Mostly dry and clear',
      source: 'estimated',
    };
  });
}

export function weatherAdvice(w: WeatherDay | undefined): string | null {
  if (!w) return null;
  if (w.rainMm >= 8 || [61, 63, 65, 80, 81, 82, 95, 96].includes(w.code))
    return 'Rain likely — indoor options surfaced for this day.';
  if (w.highC >= 34) return 'Very hot — plan outdoor sightseeing before 11:00 and after 16:00.';
  if (w.lowC <= 2) return 'Cold morning — layer up and check for ice on walking routes.';
  return null;
}
