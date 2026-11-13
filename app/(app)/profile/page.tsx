import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/AppShell';
import { ProfileClient } from '@/components/profile/ProfileClient';
import { getCurrentUser } from '@/lib/auth/session';
import { listTrips } from '@/lib/db/store';
import { cityById } from '@/lib/data/cities';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Profile & settings — Wayfarer' };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const trips = await listTrips(user.id);
  const countries = new Set(
    trips.flatMap((t) => t.brief.cityIds.map((id) => cityById(id)?.country).filter(Boolean))
  );
  const saved = user.savedDestinations.length + user.savedHotels.length + user.savedActivities.length + user.savedFlights.length;

  return (
    <div>
      <PageHeader
        eyebrow="Profile & settings"
        title="How the agent should plan for you"
        description="These preferences seed every new conversation — you can always override them by talking to the agent."
      />
      <div className="container-page py-6">
        <ProfileClient user={user} stats={{ trips: trips.length, countries: countries.size, saved }} />
      </div>
    </div>
  );
}
