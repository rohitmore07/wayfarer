import { NextResponse } from 'next/server';
import { getWeather } from '@/lib/providers/weather';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityId = url.searchParams.get('cityId');
  const start = url.searchParams.get('start') ?? new Date().toISOString().slice(0, 10);
  const days = Number(url.searchParams.get('days') ?? 7);
  if (!cityId) return NextResponse.json({ error: 'cityId is required' }, { status: 400 });
  const weather = await getWeather(cityId, start, Math.min(16, Math.max(1, days)));
  return NextResponse.json({ weather });
}
