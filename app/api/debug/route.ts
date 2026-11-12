import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { getSession, findUserById } from '@/lib/db/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TEMPORARY diagnostic route. Delete after login is fixed.
export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await getSession(token);
  const user = session ? await findUserById(session.userId) : undefined;

  return NextResponse.json({
    cookieReceived: Boolean(token),
    tokenLength: token?.length ?? 0,
    sessionFound: Boolean(session),
    userFound: Boolean(user),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
  });
}
