import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signIn, publicUser } from '@/lib/auth/session';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
    const result = await signIn(parsed.data);
    if (!result.ok || !result.user) return NextResponse.json({ error: result.error }, { status: 401 });
    return NextResponse.json({ user: publicUser(result.user) });
  } catch {
    return NextResponse.json({ error: 'Could not sign you in.' }, { status: 500 });
  }
}
