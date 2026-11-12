import { NextResponse } from 'next/server';
import { CITIES } from '@/lib/data/cities';
import { findDestinations } from '@/lib/agent/destination';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const interests = (url.searchParams.get('interests') ?? '').split(',').filter(Boolean);
  const region = url.searchParams.get('region') ?? 'any';
  const budget = Number(url.searchParams.get('budget') ?? 0);
  const month = Number(url.searchParams.get('month') ?? 0);
  const days = Number(url.searchParams.get('days') ?? 7);

  if (budget > 0) {
    const matches = findDestinations({
      budgetPerPerson: budget,
      days: days || 7,
      month: month || undefined,
      interests: interests as never,
      region: region as never,
      originCode: url.searchParams.get('origin') ?? 'BOM',
    });
    return NextResponse.json({ destinations: matches.map((m) => ({ ...m.city, match: m })) });
  }

  const filtered = CITIES.filter((c) => region === 'any' || c.region === region).filter(
    (c) => !interests.length || interests.some((i) => c.interests.includes(i as never))
  );
  return NextResponse.json({ destinations: filtered });
}
