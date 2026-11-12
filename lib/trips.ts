import { cityById } from '@/lib/data/cities';
import { computeBudget } from '@/lib/agent/budget';
import { allocateDays } from '@/lib/agent/itinerary';
import { buildPackingList } from '@/lib/agent/orchestrator';
import type { Flight, Hotel, PlanPayload, Trip } from '@/lib/types';
import { addDays } from '@/lib/utils';

export function buildTripFromPlan(userId: string, plan: PlanPayload, overrides: Partial<Trip> = {}): Trip {
  const { brief } = plan;
  const primary = cityById(brief.cityIds[0]);
  const selectedFlight =
    plan.flights.find((f) => f.tags.includes('recommended')) ?? plan.flights[0] ?? null;
  const selectedReturn =
    plan.returnFlights.find((f) => f.tags.includes('recommended')) ?? plan.returnFlights[0] ?? null;

  const trip: Trip = {
    id: `trip_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    title: `${plan.cities.map((c) => c.name).join(' · ')}`,
    subtitle: `${brief.days} days · ${brief.travelers} ${brief.travelers === 1 ? 'traveller' : 'travellers'} · from ${brief.originCity}`,
    status: new Date(brief.startDate) > new Date() ? 'upcoming' : 'past',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    brief,
    coverImage: primary?.heroImage ?? '',
    startDate: brief.startDate,
    endDate: addDays(brief.startDate, brief.days - 1),
    travelers: brief.travelers,
    cities: plan.cities.map((c) => ({ cityId: c.cityId, name: c.name, nights: c.nights })),
    flights: plan.flights,
    selectedFlightId: selectedFlight?.id,
    returnFlight: selectedReturn,
    hotels: plan.hotels,
    hotelSelections: plan.hotelSelections,
    selectedHotelId: plan.hotelSelections[brief.cityIds[0]],
    itinerary: plan.itinerary,
    budget: plan.budget,
    sources: plan.insights.map((i) => ({ label: i.title, provenance: i.provenance, detail: i.detail })),
    bookingRefs: [],
    packingList: buildPackingList(plan),
    messages: [],
    savedActivityIds: [],
    ...overrides,
  };
  return trip;
}

export function selectedFlight(trip: Trip): Flight | undefined {
  return trip.flights.find((f) => f.id === trip.selectedFlightId) ?? trip.flights[0];
}

export function selectedHotelFor(trip: Trip, cityId: string): Hotel | undefined {
  const id = trip.hotelSelections?.[cityId];
  return trip.hotels.find((h) => h.id === id) ?? trip.hotels.find((h) => h.cityId === cityId);
}

/** Recompute the budget after any manual change to flights, hotels or itinerary. */
export function recalcTripBudget(trip: Trip): Trip {
  const selectedHotels = Object.fromEntries(
    trip.cities.map((c) => [c.cityId, selectedHotelFor(trip, c.cityId)])
  ) as Record<string, Hotel | undefined>;

  const budget = computeBudget({
    brief: trip.brief,
    flight: selectedFlight(trip),
    returnFlight: trip.returnFlight ?? undefined,
    hotels: trip.hotels,
    flights: trip.flights,
    itinerary: trip.itinerary,
    cityNights: allocateDays(trip.brief.cityIds, trip.brief.days),
    selectedHotels,
  });
  return { ...trip, budget, updatedAt: new Date().toISOString() };
}

export const tripNights = (trip: Trip) => Math.max(1, trip.brief.days - 1);

export function tripSummaryLine(trip: Trip) {
  return `${trip.brief.days} days · ${trip.travelers} ${trip.travelers === 1 ? 'traveller' : 'travellers'} · ₹${trip.budget.perPerson.toLocaleString('en-IN')} pp`;
}
