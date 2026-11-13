'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Loader2, Sparkles, Trash2 } from 'lucide-react';
import type { Trip } from '@/lib/types';
import { TripWorkspaceView } from '@/components/trip/TripWorkspaceView';
import { useRouter } from 'next/navigation';

export function TripDetailClient({ initialTrip }: { initialTrip: Trip }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((next: Trip) => {
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/trips/${next.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedFlightId: next.selectedFlightId,
          returnFlight: next.returnFlight,
          hotelSelections: next.hotelSelections,
          itinerary: next.itinerary,
          brief: next.brief,
          flights: next.flights,
          hotels: next.hotels,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
      setSaving(false);
    }, 600);
  }, []);

  const onChange = (next: Trip) => {
    setTrip(next);
    persist(next);
  };

  const refine = async (message: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok) {
        setTrip(data.trip);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div>
      <TripWorkspaceView
        trip={trip}
        onChange={onChange}
        agentMode
        onRefine={refine}
        headerActions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 text-2xs text-white/80">
              {saving ? <Loader2 size={11} className="animate-spin" /> : saved ? <Check size={11} /> : <Sparkles size={11} />}
              {saving ? 'Saving…' : saved ? 'All changes saved' : 'Auto-save on'}
            </span>
            {busy ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-2xs text-white">
                <Loader2 size={11} className="animate-spin" /> Agent editing…
              </span>
            ) : null}
          </>
        }
      />
      <div className="container-page flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-xs text-ink-faint">
        <Link href="/trips" className="hover:text-ink">← Back to all trips</Link>
        <button
          onClick={async () => {
            if (!confirm('Delete this trip? This cannot be undone.')) return;
            await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
            router.push('/trips');
            router.refresh();
          }}
          className="inline-flex items-center gap-1.5 hover:text-clay-600"
        >
          <Trash2 size={12} /> Delete trip
        </button>
      </div>
    </div>
  );
}
