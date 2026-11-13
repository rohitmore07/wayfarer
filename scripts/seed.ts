import './load-env';
import { ensureDemoUser, listTrips, saveTrip } from '../lib/db/store';
import { planTrip } from '../lib/agent/orchestrator';
import { buildTripFromPlan } from '../lib/trips';
import type { Trip } from '../lib/types';
import { addDays, todayISO } from '../lib/utils';

/**
 * Seeds the demo account with three realistic trips so the dashboard,
 * workspaces and budget pages are populated on first run.
 *   npm run seed
 */

const SCENARIOS: { text: string; status?: Trip['status']; sample?: boolean }[] = [
  {
    text: 'I want to visit Japan for 7 days in March with my partner. My budget is ₹1,50,000 per person. I love Japanese culture, food, anime, nature and photography. I prefer comfortable hotels and want to explore Tokyo, Kyoto and Osaka.',
    sample: true,
  },
  {
    text: 'A relaxed 5 day Bali trip for 2 in October, budget ₹70,000 per person. We love beaches, food, nature and a bit of adventure.',
    sample: true,
  },
  {
    text: 'Long weekend in Udaipur for 3 days with my wife in December, ₹35,000 per person, heritage hotels, lakes and good food.',
    sample: true,
  },
];

async function main() {
  const user = await ensureDemoUser();
  const existing = await listTrips(user.id);
  if (existing.length) {
    console.log(`Demo account already has ${existing.length} trips — skipping.`);
    return;
  }

  for (const scenario of SCENARIOS) {
    const result = await planTrip({ text: scenario.text });
    const trip = buildTripFromPlan(user.id, result.plan, {
      isSample: scenario.sample,
      ...(scenario.status ? { status: scenario.status } : {}),
    });

    // Make the demo feel lived-in: one trip has a saved activity, a conversation and a pending booking ref.
    if (trip.cities[0]?.cityId === 'bali') {
      trip.status = 'past';
      const shift = addDays(todayISO(), -120);
      const delta = Math.round((new Date(shift).getTime() - new Date(trip.startDate).getTime()) / 86400000);
      trip.startDate = shift;
      trip.endDate = addDays(shift, trip.brief.days - 1);
      trip.brief.startDate = shift;
      trip.itinerary = trip.itinerary.map((d) => ({ ...d, date: addDays(d.date, delta) }));
      trip.messages = [
        {
          id: 'msg_seed_1',
          role: 'assistant',
          content:
            'Trimmed the Ubud stay to three nights and moved the last two to Seminyak so you end near the beach. Total is now ₹68,400 per person.',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
      ];
      trip.savedActivityIds = [trip.itinerary[0]?.activities[0]?.poiId].filter(Boolean) as string[];
    }

    await saveTrip(trip);
    console.log(`Seeded "${trip.title}" — ${trip.brief.days} days, ₹${trip.budget.perPerson.toLocaleString('en-IN')} pp`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
