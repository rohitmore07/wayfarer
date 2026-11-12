import { PageHeader } from '@/components/layout/AppShell';
import { ExploreClient } from '@/components/explore/ExploreClient';

export const metadata = { title: 'Destination explorer — Wayfarer' };

export default function ExplorePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Destination explorer"
        title="Find the place that fits the trip you have in mind"
        description="Filter 14 curated destinations by region and interest, or hand the brief to the AI finder and let it rank them against your budget and month."
      />
      <div className="container-page py-6">
        <ExploreClient />
      </div>
    </div>
  );
}
