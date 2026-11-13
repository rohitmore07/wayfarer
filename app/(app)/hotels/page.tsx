import { PageHeader } from '@/components/layout/AppShell';
import { HotelSearch } from '@/components/search/HotelSearch';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Hotels & stays — Wayfarer' };

export default async function HotelsPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const { city } = await searchParams;
  return (
    <div>
      <PageHeader
        eyebrow="Stays"
        title="Hotels ranked against your route, not a generic list"
        description="Filter by price, guest score, property type and amenities. Every property is scored for proximity to the attractions your itinerary actually visits."
      />
      <div className="container-page py-6">
        <HotelSearch defaultCity={city} />
      </div>
    </div>
  );
}
