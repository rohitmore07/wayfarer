import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { deleteTrip, getTrip, saveTrip } from '@/lib/db/store';
import { recalcTripBudget } from '@/lib/trips';
import type { Trip } from '@/lib/types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { id } = await params;
  const trip = getTrip(user.id, id);
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  return NextResponse.json({ trip });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { id } = await params;
  const existing = getTrip(user.id, id);
  if (!existing) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  try {
    const patch = (await req.json()) as Partial<Trip>;
    const merged: Trip = { ...existing, ...patch, id: existing.id, userId: user.id, updatedAt: new Date().toISOString() };
    const needsRecalc = Boolean(patch.selectedFlightId || patch.returnFlight || patch.hotelSelections || patch.itinerary || patch.flights || patch.brief);
    const saved = needsRecalc ? recalcTripBudget(merged) : merged;
    saveTrip(saved);
    return NextResponse.json({ trip: saved });
  } catch (err) {
    console.error('[trips] patch failed', err);
    return NextResponse.json({ error: 'Could not update the trip.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { id } = await params;
  deleteTrip(user.id, id);
  return NextResponse.json({ ok: true });
}
