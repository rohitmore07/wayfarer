import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listTrips, saveTrip } from '@/lib/db/store';
import { buildTripFromPlan } from '@/lib/trips';
import type { PlanPayload } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  return NextResponse.json({ trips: listTrips(user.id) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save this trip.' }, { status: 401 });
  try {
    const { plan, title } = (await req.json()) as { plan: PlanPayload; title?: string };
    if (!plan?.brief?.cityIds?.length) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    const trip = buildTripFromPlan(user.id, plan, title ? { title } : {});
    saveTrip(trip);
    return NextResponse.json({ trip });
  } catch (err) {
    console.error('[trips] create failed', err);
    return NextResponse.json({ error: 'Could not save the trip.' }, { status: 500 });
  }
}
