import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getTrip } from '@/lib/db/store';
import { TripDetailClient } from '@/components/trips/TripDetailClient';

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const trip = await getTrip(user.id, id);
  if (!trip) notFound();
  return <TripDetailClient initialTrip={trip} />;
}
