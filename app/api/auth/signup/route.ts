import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signUp, publicUser } from '@/lib/auth/session';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid details' }, { status: 400 });
    }
    const result = await signUp(parsed.data);
    if (!result.ok || !result.user) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ user: publicUser(result.user) });
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
