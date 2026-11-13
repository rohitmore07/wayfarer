import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Pool } from 'pg';
import type { ChatMessage, Session, Trip, User } from '@/lib/types';

/**
 * Persistence layer — PostgreSQL.
 *
 * Each table stores its record as JSONB in a `data` column, with the columns
 * we filter or sort on (id, user_id, email, expires_at, updated_at) broken out.
 * Every export is async. Set DATABASE_URL (or POSTGRES_URL, which Vercel
 * Postgres / Neon set automatically) to your connection string.
 */

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface StoredDocument {
  id: string;
  userId: string;
  name: string;
  type: 'passport' | 'visa' | 'insurance' | 'ticket' | 'other';
  note: string;
  createdAt: string;
}

/* ------------------------------ connection ------------------------------ */

const g = globalThis as unknown as {
  __wayfarerPool?: Pool;
  __wayfarerSchema?: Promise<void>;
};

function pool(): Pool {
  if (!g.__wayfarerPool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Create a file named exactly ".env.local" in the project root (the folder that ' +
          'contains package.json) with DATABASE_URL=postgres://… and restart the dev server.'
      );
    }
    g.__wayfarerPool = new Pool({
      connectionString: url,
      max: 5,
      ssl: /sslmode=require|neon\.tech|supabase/.test(url) ? { rejectUnauthorized: false } : undefined,
    });
  }
  return g.__wayfarerPool;
}

function ensureSchema(): Promise<void> {
  if (!g.__wayfarerSchema) {
    g.__wayfarerSchema = pool()
      .query(`
        CREATE TABLE IF NOT EXISTS wf_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          data JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS wf_sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          data JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS wf_trips (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          data JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS wf_trips_user_idx ON wf_trips (user_id);
        CREATE TABLE IF NOT EXISTS wf_conversations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          data JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS wf_conversations_user_idx ON wf_conversations (user_id);
        CREATE TABLE IF NOT EXISTS wf_documents (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS wf_documents_user_idx ON wf_documents (user_id);
      `)
      .then(() => undefined)
      .catch((err) => {
        g.__wayfarerSchema = undefined;
        throw err;
      });
  }
  return g.__wayfarerSchema;
}

async function query<R extends object = Record<string, unknown>>(text: string, params: unknown[] = []) {
  await ensureSchema();
  return pool().query<R>(text, params);
}

/* ---------------------------------- auth --------------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export const AVATAR_COLORS = ['#C05B34', '#2F5F57', '#A97E33', '#3F6E8C', '#8A3A20'];

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const res = await query<{ data: User }>('SELECT data FROM wf_users WHERE email = $1', [email.trim().toLowerCase()]);
  return res.rows[0]?.data;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const res = await query<{ data: User }>('SELECT data FROM wf_users WHERE id = $1', [id]);
  return res.rows[0]?.data;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  homeCity?: string;
  homeAirport?: string;
}): Promise<User> {
  const user: User = {
    id: `usr_${randomBytes(6).toString('hex')}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    homeCity: input.homeCity ?? 'Mumbai',
    homeAirport: input.homeAirport ?? 'BOM',
    preferences: {
      interests: ['culture', 'food', 'nature'],
      hotelClass: 'comfort',
      pace: 'balanced',
      currency: 'INR',
    },
    savedDestinations: [],
    savedHotels: [],
    savedFlights: [],
    savedActivities: [],
  };
  await query('INSERT INTO wf_users (id, email, data) VALUES ($1, $2, $3)', [user.id, user.email, user]);
  return user;
}

export async function updateUser(userId: string, patch: Partial<User>): Promise<User | undefined> {
  // Postgres merges the JSONB objects atomically; id is never changed.
  const { id: _ignored, ...rest } = patch;
  const res = await query<{ data: User }>(
    'UPDATE wf_users SET data = data || $2::jsonb WHERE id = $1 RETURNING data',
    [userId, JSON.stringify(rest)]
  );
  return res.rows[0]?.data;
}

export async function createSession(userId: string): Promise<Session> {
  const session: Session = {
    token: randomBytes(24).toString('hex'),
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  };
  await query('DELETE FROM wf_sessions WHERE expires_at < now()');
  await query('INSERT INTO wf_sessions (token, user_id, expires_at, data) VALUES ($1, $2, $3, $4)', [
    session.token,
    userId,
    session.expiresAt,
    session,
  ]);
  return session;
}

export async function getSession(token: string | undefined): Promise<Session | undefined> {
  if (!token) return undefined;
  const res = await query<{ data: Session }>(
    'SELECT data FROM wf_sessions WHERE token = $1 AND expires_at > now()',
    [token]
  );
  return res.rows[0]?.data;
}

export async function deleteSession(token: string) {
  await query('DELETE FROM wf_sessions WHERE token = $1', [token]);
}

/* ---------------------------------- trips -------------------------------- */

export async function listTrips(userId: string): Promise<Trip[]> {
  const res = await query<{ data: Trip }>(
    'SELECT data FROM wf_trips WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId]
  );
  return res.rows.map((r) => r.data);
}

export async function getTrip(userId: string, tripId: string): Promise<Trip | undefined> {
  const res = await query<{ data: Trip }>('SELECT data FROM wf_trips WHERE id = $1 AND user_id = $2', [
    tripId,
    userId,
  ]);
  return res.rows[0]?.data;
}

export async function saveTrip(trip: Trip): Promise<Trip> {
  await query(
    `INSERT INTO wf_trips (id, user_id, updated_at, data) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = EXCLUDED.updated_at, data = EXCLUDED.data`,
    [trip.id, trip.userId, trip.updatedAt, trip]
  );
  return trip;
}

export async function deleteTrip(userId: string, tripId: string) {
  await query('DELETE FROM wf_trips WHERE id = $1 AND user_id = $2', [tripId, userId]);
}

/* ------------------------------- conversations ---------------------------- */

export async function listConversations(userId: string): Promise<Conversation[]> {
  const res = await query<{ data: Conversation }>(
    'SELECT data FROM wf_conversations WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId]
  );
  return res.rows.map((r) => r.data);
}

export async function upsertConversation(conv: Conversation): Promise<Conversation> {
  await query(
    `INSERT INTO wf_conversations (id, user_id, updated_at, data) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = EXCLUDED.updated_at, data = EXCLUDED.data`,
    [conv.id, conv.userId, conv.updatedAt, conv]
  );
  return conv;
}

/* -------------------------------- documents ------------------------------- */

export async function listDocuments(userId: string): Promise<StoredDocument[]> {
  const res = await query<{ data: StoredDocument }>('SELECT data FROM wf_documents WHERE user_id = $1', [userId]);
  return res.rows.map((r) => r.data);
}

export async function addDocument(doc: StoredDocument) {
  await query('INSERT INTO wf_documents (id, user_id, data) VALUES ($1, $2, $3)', [doc.id, doc.userId, doc]);
}

/* --------------------------------- seeding -------------------------------- */

export async function ensureDemoUser(): Promise<User> {
  const existing = await findUserByEmail('demo@wayfarer.ai');
  if (existing) return existing;
  let user: User;
  try {
    user = await createUser({
      name: 'Aarav Mehta',
      email: 'demo@wayfarer.ai',
      password: 'demo1234',
      homeCity: 'Mumbai',
      homeAirport: 'BOM',
    });
  } catch {
    // Another request created the demo user at the same moment (unique email).
    const again = await findUserByEmail('demo@wayfarer.ai');
    if (again) return again;
    throw new Error('Could not create the demo account');
  }
  return (
    (await updateUser(user.id, {
      preferences: {
        interests: ['culture', 'food', 'photography', 'nature'],
        hotelClass: 'comfort',
        pace: 'balanced',
        currency: 'INR',
      },
      savedDestinations: ['kyoto', 'reykjavik', 'bali'],
    })) ?? user
  );
}
