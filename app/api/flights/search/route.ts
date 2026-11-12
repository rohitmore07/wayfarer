import { NextResponse } from 'next/server';
import { z } from 'zod';
import { searchFlights } from '@/lib/providers/flights';

export const runtime = 'nodejs';

const schema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  travelers: z.number().int().min(1).max(9),
  cabin: z.enum(['economy', 'premium', 'business']),
  nonStopOnly: z.boolean().optional(),
  airlines: z.array(z.string()).optional(),
  departWindow: z.enum(['any', 'morning', 'afternoon', 'evening']).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid search' }, { status: 400 });
    }
    const result = await searchFlights({ ...parsed.data, returnDate: parsed.data.returnDate || undefined });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[flights]', err);
    return NextResponse.json({ error: 'Flight search is unavailable right now.' }, { status: 500 });
  }
}
