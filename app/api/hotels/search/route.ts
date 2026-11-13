import { NextResponse } from 'next/server';
import { z } from 'zod';
import { searchHotels } from '@/lib/providers/hotels';
import { cityById } from '@/lib/data/cities';

export const runtime = 'nodejs';

const schema = z.object({
  cityId: z.string(),
  tier: z.enum(['budget', 'comfort', 'luxury', 'any']).optional(),
  minRating: z.number().min(0).max(10).optional(),
  maxPrice: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  propertyTypes: z.array(z.string()).optional(),
  sort: z.enum(['recommended', 'price-asc', 'price-desc', 'rating']).optional(),
  guests: z.number().int().min(1).max(12).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid hotel search' }, { status: 400 });
    const city = cityById(parsed.data.cityId);
    if (!city) return NextResponse.json({ error: 'Unknown destination' }, { status: 404 });
    const hotels = searchHotels(
      { ...parsed.data, propertyTypes: parsed.data.propertyTypes as never },
      city.pois
    );
    return NextResponse.json({ hotels, city: { id: city.id, name: city.name } });
  } catch (err) {
    console.error('[hotels]', err);
    return NextResponse.json({ error: 'Hotel search is unavailable right now.' }, { status: 500 });
  }
}
