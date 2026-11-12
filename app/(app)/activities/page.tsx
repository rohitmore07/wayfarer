import { PageHeader } from '@/components/layout/AppShell';
import { ActivityExplorer } from '@/components/search/ActivityExplorer';

export const metadata = { title: 'Experiences — Wayfarer' };

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const { city } = await searchParams;
  return (
    <div>
      <PageHeader
        eyebrow="Experiences"
        title="The things worth rearranging a day for"
        description="Attractions, food tours, hikes, museums and local experiences — filtered by interest, budget, duration and indoor/outdoor."
      />
      <div className="container-page py-6">
        <ActivityExplorer defaultCity={city} />
      </div>
    </div>
  );
}
