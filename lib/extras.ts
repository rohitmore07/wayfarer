import { cityById } from '@/lib/data/cities';
import type { PackingGroup, PlanPayload } from '@/lib/types';

/** Pure helpers shared by server and client (packing + safety assistants). */
export function buildPackingList(plan: Pick<PlanPayload, 'brief' | 'itinerary'>): PackingGroup[] {
  const city = cityById(plan.brief.cityIds[0]);
  const month = new Date(plan.brief.startDate).getMonth() + 1;
  const climate = city?.climate.find((c) => c.month === month);
  const hot = (climate?.highC ?? 22) >= 27;
  const cold = (climate?.lowC ?? 12) <= 8;
  const rainy = (climate?.rainMm ?? 50) > 90;
  const adventure = plan.brief.interests.includes('adventure');

  return [
    {
      title: 'Essentials',
      items: [
        { label: 'Passport + visa printout' },
        { label: 'Travel insurance policy' },
        { label: 'Cards + ₹8,000 equivalent cash' },
        { label: 'Phone + charger + power bank' },
        { label: 'Universal power adapter' },
        { label: 'eSIM installed before departure' },
      ],
    },
    {
      title: 'Clothing',
      items: [
        ...(hot ? [{ label: 'Light breathable layers (5)' }, { label: 'Sun hat & sunglasses' }] : []),
        ...(cold ? [{ label: 'Thermal base layer' }, { label: 'Insulated jacket' }, { label: 'Gloves & beanie' }] : []),
        ...(rainy ? [{ label: 'Compact umbrella' }, { label: 'Waterproof shell' }] : []),
        { label: 'Comfortable walking shoes (broken in)' },
        { label: 'One smart-casual outfit for dinners' },
        ...(plan.brief.cityIds.some((c) => ['kyoto', 'tokyo', 'bangkok'].includes(c))
          ? [{ label: 'Shoulder-covering top for temples' }]
          : []),
      ],
    },
    {
      title: 'Day bag',
      items: [
        { label: 'Refillable water bottle' },
        { label: 'Sunscreen SPF 50' },
        { label: 'Hand sanitiser & tissues' },
        { label: 'Reusable shopping tote' },
        ...(adventure ? [{ label: 'Quick-dry towel' }, { label: 'Dry bag for electronics' }] : []),
      ],
    },
    {
      title: 'Health & documents',
      items: [
        { label: 'Personal medication + prescription' },
        { label: 'ORS sachets & basic first aid' },
        { label: 'Printed hotel confirmations' },
        { label: 'Emergency contact card' },
      ],
    },
  ];
}

export function safetyBriefing(plan: Pick<PlanPayload, 'brief'>) {
  return plan.brief.cityIds
    .map((id) => cityById(id))
    .filter(Boolean)
    .map((c) => ({
      city: c!.name,
      level: c!.safety.level,
      summary: c!.safety.summary,
      tips: c!.safety.tips,
      emergency: c!.safety.emergency,
      visaNote: c!.visaNote,
    }));
}
