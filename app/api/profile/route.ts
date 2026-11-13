import { NextResponse } from 'next/server';
import { getCurrentUser, publicUser } from '@/lib/auth/session';
import { updateUser } from '@/lib/db/store';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  try {
    const patch = await req.json();
    const allowed = ['name', 'homeCity', 'homeAirport', 'preferences', 'avatarColor'];
    const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));
    const updated = await updateUser(user.id, clean);
    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    return NextResponse.json({ user: publicUser(updated) });
  } catch {
    return NextResponse.json({ error: 'Could not save your preferences.' }, { status: 500 });
  }
}
