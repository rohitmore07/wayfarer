import { cookies } from 'next/headers';
import {
  createSession,
  createUser,
  deleteSession,
  ensureDemoUser,
  findUserByEmail,
  findUserById,
  getSession,
  verifyPassword,
} from '@/lib/db/store';
import type { User } from '@/lib/types';

export const SESSION_COOKIE = 'wayfarer_session';

export interface AuthResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = getSession(token);
  if (!session) return null;
  return findUserById(session.userId) ?? null;
}

export async function setSessionCookie(userId: string) {
  const session = createSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(session.expiresAt),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  store.delete(SESSION_COOKIE);
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' };
  if (input.password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  if (!input.name.trim()) return { ok: false, error: 'Please tell us your name.' };
  if (findUserByEmail(email)) return { ok: false, error: 'An account with this email already exists.' };

  const user = createUser(input);
  await setSessionCookie(user.id);
  return { ok: true, user };
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const user = findUserByEmail(input.email);
  if (!user) return { ok: false, error: 'No account found with that email.' };
  if (!verifyPassword(input.password, user.passwordHash)) return { ok: false, error: 'Incorrect password.' };
  await setSessionCookie(user.id);
  return { ok: true, user };
}

export async function signInDemo(): Promise<AuthResult> {
  const user = ensureDemoUser();
  await setSessionCookie(user.id);
  return { ok: true, user };
}

export async function signOut() {
  await clearSessionCookie();
}

export const publicUser = (user: User) => {
  const { passwordHash, ...rest } = user;
  return rest;
};
