import fs from 'node:fs';
import path from 'node:path';
import type { ChatMessage, Session, Trip, User } from '@/lib/types';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Persistence layer.
 *
 * A single JSON document store keeps the demo zero-setup (no Postgres daemon
 * required in the sandbox) while exposing the same repository shape you would
 * implement over Prisma. `prisma/schema.prisma` in this repo is the production
 * schema; swapping this file for Prisma queries touches nothing else in the app.
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

interface DB {
  version: number;
  users: User[];
  sessions: Session[];
  trips: Trip[];
  conversations: Conversation[];
  documents: StoredDocument[];
}

const DB_DIR = process.env.VERCEL ? '/tmp/wayfarer' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const EMPTY: DB = { version: 1, users: [], sessions: [], trips: [], conversations: [], documents: [] };

let cache: DB | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function load(): DB {
  if (cache) return cache;
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    cache = { ...EMPTY };
    persist(cache);
    return cache;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as DB;
    cache = { ...EMPTY, ...parsed };
  } catch {
    cache = { ...EMPTY };
  }
  return cache!;
}

function persist(db: DB) {
  ensureDir();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/** Mutate the store atomically. */
export function mutate<T>(fn: (db: DB) => T): T {
  const db = load();
  const result = fn(db);
  writeQueue = writeQueue.then(() => {
    try {
      persist(db);
    } catch (err) {
      console.error('[db] write failed', err);
    }
  });
  return result;
}

export function read<T>(fn: (db: DB) => T): T {
  return fn(load());
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

export function findUserByEmail(email: string): User | undefined {
  return read((db) => db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()));
}

export function findUserById(id: string): User | undefined {
  return read((db) => db.users.find((u) => u.id === id));
}

export function createUser(input: {
  name: string;
  email: string;
  password: string;
  homeCity?: string;
  homeAirport?: string;
}): User {
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
  mutate((db) => {
    db.users.push(user);
  });
  return user;
}

export function updateUser(userId: string, patch: Partial<User>): User | undefined {
  return mutate((db) => {
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx < 0) return undefined;
    db.users[idx] = { ...db.users[idx], ...patch, id: userId };
    return db.users[idx];
  });
}

export function createSession(userId: string): Session {
  const session: Session = {
    token: randomBytes(24).toString('hex'),
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  };
  mutate((db) => {
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now());
    db.sessions.push(session);
  });
  return session;
}

export function getSession(token: string | undefined): Session | undefined {
  if (!token) return undefined;
  return read((db) =>
    db.sessions.find((s) => s.token === token && new Date(s.expiresAt).getTime() > Date.now())
  );
}

export function deleteSession(token: string) {
  mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token);
  });
}

/* ---------------------------------- trips -------------------------------- */

export function listTrips(userId: string): Trip[] {
  return read((db) =>
    db.trips
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  );
}

export function getTrip(userId: string, tripId: string): Trip | undefined {
  return read((db) => db.trips.find((t) => t.id === tripId && t.userId === userId));
}

export function saveTrip(trip: Trip): Trip {
  mutate((db) => {
    const idx = db.trips.findIndex((t) => t.id === trip.id);
    if (idx >= 0) db.trips[idx] = trip;
    else db.trips.push(trip);
  });
  return trip;
}

export function deleteTrip(userId: string, tripId: string) {
  mutate((db) => {
    db.trips = db.trips.filter((t) => !(t.id === tripId && t.userId === userId));
  });
}

/* ------------------------------- conversations ---------------------------- */

export function listConversations(userId: string): Conversation[] {
  return read((db) =>
    db.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  );
}

export function upsertConversation(conv: Conversation): Conversation {
  mutate((db) => {
    const idx = db.conversations.findIndex((c) => c.id === conv.id);
    if (idx >= 0) db.conversations[idx] = conv;
    else db.conversations.push(conv);
  });
  return conv;
}

/* -------------------------------- documents ------------------------------- */

export function listDocuments(userId: string): StoredDocument[] {
  return read((db) => db.documents.filter((d) => d.userId === userId));
}

export function addDocument(doc: StoredDocument) {
  mutate((db) => {
    db.documents.push(doc);
  });
}

/* --------------------------------- seeding -------------------------------- */

export function ensureDemoUser(): User {
  const existing = findUserByEmail('demo@wayfarer.ai');
  if (existing) return existing;
  const user = createUser({
    name: 'Aarav Mehta',
    email: 'demo@wayfarer.ai',
    password: 'demo1234',
    homeCity: 'Mumbai',
    homeAirport: 'BOM',
  });
  return (
    updateUser(user.id, {
      preferences: {
        interests: ['culture', 'food', 'photography', 'nature'],
        hotelClass: 'comfort',
        pace: 'balanced',
        currency: 'INR',
      },
      savedDestinations: ['kyoto', 'reykjavik', 'bali'],
    }) ?? user
  );
}

export const dbPath = DB_FILE;
export type { DB };
