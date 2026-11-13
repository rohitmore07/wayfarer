'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import type { HotelClass, Interest, Pace, User } from '@/lib/types';
import { AIRPORTS } from '@/lib/data/airports';
import { INTEREST_LABELS } from '@/lib/agent/destination';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';

const INTERESTS: Interest[] = ['culture', 'food', 'nature', 'adventure', 'art', 'history', 'photography', 'relaxation', 'family', 'nightlife', 'shopping', 'anime'];

export function ProfileClient({ user, stats }: { user: User; stats: { trips: number; countries: number; saved: number } }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [homeCity, setHomeCity] = useState(user.homeCity);
  const [homeAirport, setHomeAirport] = useState(user.homeAirport);
  const [interests, setInterests] = useState<Interest[]>(user.preferences.interests);
  const [hotelClass, setHotelClass] = useState<HotelClass>(user.preferences.hotelClass);
  const [pace, setPace] = useState<Pace>(user.preferences.pace);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        homeCity,
        homeAirport,
        preferences: { ...user.preferences, interests, hotelClass, pace },
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-4">
            <Avatar name={name} color={user.avatarColor} size={52} />
            <div>
              <p className="font-display text-xl text-ink">{name}</p>
              <p className="text-xs text-ink-mute">{user.email}</p>
              <p className="mt-1 text-2xs text-ink-faint">
                Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-2xs text-ink-faint">Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="field py-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-2xs text-ink-faint">Home airport</span>
              <select
                value={homeAirport}
                onChange={(e) => {
                  setHomeAirport(e.target.value);
                  const a = AIRPORTS.find((x) => x.code === e.target.value);
                  if (a) setHomeCity(a.city);
                }}
                className="field py-2.5 text-sm"
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.city} ({a.code})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5">
            <span className="mb-1.5 block text-2xs text-ink-faint">Travel interests</span>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  onClick={() => setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))}
                  className={cn('chip text-2xs', interests.includes(i) && 'chip-active')}
                >
                  {INTEREST_LABELS[i]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-2xs text-ink-faint">Default stay style</span>
              <div className="flex rounded-full border border-line bg-parchment p-1">
                {(['budget', 'comfort', 'luxury'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setHotelClass(s)}
                    className={cn('flex-1 rounded-full px-2 py-1.5 text-2xs font-medium capitalize', hotelClass === s ? 'bg-white text-ink shadow-sm' : 'text-ink-mute')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-2xs text-ink-faint">Default pace</span>
              <div className="flex rounded-full border border-line bg-parchment p-1">
                {(['relaxed', 'balanced', 'packed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPace(s)}
                    className={cn('flex-1 rounded-full px-2 py-1.5 text-2xs font-medium capitalize', pace === s ? 'bg-white text-ink shadow-sm' : 'text-ink-mute')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <p className="text-2xs text-ink-faint">Saved preferences personalise every new plan.</p>
            <button onClick={save} className="btn-primary text-xs" disabled={saving}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : null}
              {saved ? 'Saved' : 'Save changes'}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <ShieldCheck size={14} className="text-pine-600" /> Privacy & data
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-mute">
            Trips, conversations and budgets are scoped to your account with session-based authorisation on every API
            route. Nobody else can read your travel data — including the demo account.
          </p>
          <div className="mt-4 space-y-2">
            {[
              ['Profile & preferences', 'Stored in your account record'],
              ['Trip data', 'Private to your user id'],
              ['AI conversations', 'Saved with the trip they modified'],
              ['Provider credentials', 'Server-side only (never exposed to the browser)'],
            ].map(([label, note]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-parchment px-3 py-2">
                <span className="text-xs text-ink-soft">{label}</span>
                <span className="text-2xs text-ink-faint">{note}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/');
                router.refresh();
              }}
              className="btn-ghost text-xs"
            >
              <LogOut size={13} /> Sign out
            </button>
            <button onClick={() => alert('Account deletion is disabled in this demo build.')} className="btn-quiet text-xs text-clay-600">
              <Trash2 size={13} /> Delete account
            </button>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="label-caps">Your travel footprint</p>
          <div className="mt-3 space-y-3">
            {[
              ['Trips planned', stats.trips],
              ['Countries touched', stats.countries],
              ['Saved items', stats.saved],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between border-b border-line pb-2 last:border-0 last:pb-0">
                <span className="text-xs text-ink-mute">{label}</span>
                <span className="font-display text-lg text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-parchment p-5">
          <p className="label-caps">Home base</p>
          <p className="mt-2 font-display text-xl text-ink">{homeCity}</p>
          <p className="text-xs text-ink-mute">{homeAirport} · {AIRPORTS.find((a) => a.code === homeAirport)?.name}</p>
          <p className="mt-3 text-2xs leading-relaxed text-ink-faint">
            Used as the default departure point for flight searches and destination budget estimates.
          </p>
        </div>
      </aside>
    </div>
  );
}
