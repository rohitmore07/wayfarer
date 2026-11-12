import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getTrip, saveTrip } from '@/lib/db/store';
import { refinePlan } from '@/lib/agent/orchestrator';
import { recalcTripBudget } from '@/lib/trips';
import type { ChatMessage, PlanPayload, Trip } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const toPlan = (trip: Trip): PlanPayload => ({
  brief: trip.brief,
  cities: trip.cities.map((c) => {
    return { cityId: c.cityId, name: c.name, nights: c.nights, tagline: '' };
  }),
  flights: trip.flights,
  returnFlights: trip.returnFlight ? [trip.returnFlight] : [],
  hotels: trip.hotels,
  hotelSelections: trip.hotelSelections ?? {},
  itinerary: trip.itinerary,
  budget: trip.budget,
  highlights: [],
  followUps: [],
  insights: trip.sources.map((s) => ({ title: s.label, detail: s.detail, provenance: s.provenance })),
});

export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const { id } = await params;
  const trip = getTrip(user.id, id);
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  try {
    const { message } = (await req.json()) as { message: string };
    if (!message?.trim()) return NextResponse.json({ error: 'Say something first.' }, { status: 400 });

    const result = await refinePlan(toPlan(trip), message.trim().slice(0, 600));

    const userMessage: ChatMessage = {
      id: `msg_${Math.random().toString(36).slice(2, 9)}`,
      role: 'user',
      content: message.trim(),
      createdAt: new Date().toISOString(),
    };
    const assistantMessage: ChatMessage = {
      id: `msg_${Math.random().toString(36).slice(2, 9)}`,
      role: 'assistant',
      content: result.reply,
      createdAt: new Date().toISOString(),
    };

    const updated: Trip = recalcTripBudget({
      ...trip,
      brief: result.plan.brief,
      flights: result.plan.flights,
      returnFlight: result.plan.returnFlights[0] ?? trip.returnFlight,
      hotels: result.plan.hotels,
      hotelSelections: result.plan.hotelSelections,
      selectedHotelId: result.plan.hotelSelections[result.plan.brief.cityIds[0]] ?? trip.selectedHotelId,
      selectedFlightId:
        result.plan.flights.find((f) => f.tags.includes('recommended'))?.id ?? trip.selectedFlightId,
      itinerary: result.plan.itinerary,
      cities: result.plan.cities.map((c) => ({ cityId: c.cityId, name: c.name, nights: c.nights })),
      updatedAt: new Date().toISOString(),
      messages: [...trip.messages, userMessage, assistantMessage],
      title: trip.title,
    });

    saveTrip(updated);
    return NextResponse.json({ trip: updated, reply: result.reply, changed: result.changed });
  } catch (err) {
    console.error('[trips] chat failed', err);
    return NextResponse.json({ error: 'The agent could not process that. Try again.' }, { status: 500 });
  }
}
