import { NextResponse } from 'next/server';
import { getCurrentUser, publicUser } from '@/lib/auth/session';
import { updateUser } from '@/lib/db/store';

export const runtime = 'nodejs';

type Kind = 'savedDestinations' | 'savedHotels' | 'savedFlights' | 'savedActivities';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to save favourites.' }, { status: 401 });
  try {
    const { kind, id } = (await req.json()) as { kind: Kind; id: string };
    if (!['savedDestinations', 'savedHotels', 'savedFlights', 'savedActivities'].includes(kind))
      return NextResponse.json({ error: 'Unknown list' }, { status: 400 });
    const list = user[kind] ?? [];
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    const updated = updateUser(user.id, { [kind]: next } as never);
    return NextResponse.json({ user: updated ? publicUser(updated) : null, saved: next.includes(id) });
  } catch {
    return NextResponse.json({ error: 'Could not update favourites.' }, { status: 500 });
  }
}
