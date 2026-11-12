import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/AppShell';
import { TripsDashboard } from '@/components/trips/TripsDashboard';
import { getCurrentUser } from '@/lib/auth/session';
import { listTrips } from '@/lib/db/store';

export const metadata = { title: 'My trips — Wayfarer' };

export default async function TripsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const trips = listTrips(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="My trips"
        title={`Welcome back, ${user.name.split(' ')[0]}.`}
        description="Every trip you have planned, with its itinerary, flights, stays and budget in one workspace."
      />
      <div className="container-page py-6">
        <TripsDashboard trips={trips} user={user} />
      </div>
    </div>
  );
}
