import { NextResponse } from 'next/server';
import { signInDemo, publicUser } from '@/lib/auth/session';

export async function POST() {
  const result = await signInDemo();
  if (!result.ok || !result.user) return NextResponse.json({ error: 'Demo unavailable' }, { status: 500 });
  return NextResponse.json({ user: publicUser(result.user) });
}
