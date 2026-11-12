import { NextResponse } from 'next/server';
import { CITIES } from '@/lib/data/cities';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cityId = url.searchParams.get('cityId');
  const category = url.searchParams.get('category');
  const interest = url.searchParams.get('interest');
  const maxPrice = Number(url.searchParams.get('maxPrice') ?? 0);
  const indoor = url.searchParams.get('indoor');
  const minRating = Number(url.searchParams.get('minRating') ?? 0);
  const q = url.searchParams.get('q')?.toLowerCase();

  const pool = CITIES.filter((c) => !cityId || c.id === cityId).flatMap((c) =>
    c.pois.map((p) => ({ ...p, cityName: c.name, country: c.country }))
  );

  const activities = pool
    .filter((p) => !category || category === 'all' || p.category === category)
    .filter((p) => !interest || interest === 'all' || p.interests.includes(interest as never))
    .filter((p) => !maxPrice || p.costINR <= maxPrice)
    .filter((p) => indoor === null || indoor === 'all' || (indoor === 'indoor' ? p.indoor : !p.indoor))
    .filter((p) => !minRating || p.rating >= minRating)
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    .sort((a, b) => b.rating - a.rating);

  return NextResponse.json({ activities, total: activities.length });
}
