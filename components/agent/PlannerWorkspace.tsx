'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUp,
  Check,
  Circle,
  Loader2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Bookmark,
  ArrowLeft,
  PanelRight,
  Plane,
  BedDouble,
  CalendarDays,
  Wallet,
  Compass,
} from 'lucide-react';
import type { AgentStep, ChatMessage, PlanPayload, Trip } from '@/lib/types';
import { buildTripFromPlan } from '@/lib/trips';
import { cityById } from '@/lib/data/cities';
import { cn, fmtDate, inr } from '@/lib/utils';
import { TripWorkspaceView } from '@/components/trip/TripWorkspaceView';
import { Avatar } from '@/components/ui';

type Msg = ChatMessage & { pending?: boolean };

const STARTERS = [
  'Japan for 7 days in March with my partner, ₹1.5L per person — culture, food, anime, photography. Comfortable hotels, Tokyo, Kyoto and Osaka.',
  'A quiet 5-day beach trip in November under ₹60,000 per person',
  '10 days in Europe in May, art and food, budget ₹2.5L each',
  'Long weekend in Rajasthan from Mumbai for 4 days, heritage hotels',
];

const AGENT_LABEL: Record<string, string> = {
  planner: 'Planner',
  destination: 'Research',
  flight: 'Flights',
  hotel: 'Stays',
  itinerary: 'Itinerary',
  budget: 'Budget',
  weather: 'Weather',
  safety: 'Safety',
};

export function PlannerWorkspace({
  initialQuery,
  user,
}: {
  initialQuery?: string;
  user: { name: string; avatarColor: string } | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState('');
  const [mobileView, setMobileView] = useState<'chat' | 'plan'>('chat');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'auth'>('idle');
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && !started.current) {
      started.current = true;
      void send(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const updateAssistant = (id: string, patch: Partial<Msg>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const applyPlan = (p: PlanPayload) => {
    setPlan(p);
    setTrip(buildTripFromPlan(user ? 'preview' : 'guest', p));
    setMobileView('plan');
  };

  async function send(text: string) {
    if (busy) return;
    const userMsg: Msg = {
      id: `m_${Math.random().toString(36).slice(2, 9)}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const assistantId = `m_${Math.random().toString(36).slice(2, 9)}`;
    const assistantMsg: Msg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      steps: [],
      pending: true,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setValue('');
    setBusy(true);

    try {
      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok || !res.body) throw new Error('The agent is unavailable right now. Try again in a moment.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';
      const steps: AgentStep[] = [];

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          let ev: any;
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          if (ev.type === 'step') {
            const idx = steps.findIndex((s) => s.id === ev.step.id);
            if (idx >= 0) steps[idx] = ev.step;
            else steps.push(ev.step);
            updateAssistant(assistantId, { steps: [...steps] });
          } else if (ev.type === 'plan') {
            updateAssistant(assistantId, { plan: ev.plan });
            applyPlan(ev.plan);
          } else if (ev.type === 'token') {
            content += ev.delta;
            updateAssistant(assistantId, { content });
          } else if (ev.type === 'error') {
            content += ev.message;
            updateAssistant(assistantId, { content, pending: false });
          }
        }
      }
      updateAssistant(assistantId, { pending: false, content: content || 'Plan ready.' });
    } catch (err) {
      updateAssistant(assistantId, {
        pending: false,
        content: (err as Error).message || 'Something went wrong. Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function refine(message: string) {
    if (!plan || busy) return;
    const userMsg: Msg = {
      id: `m_${Math.random().toString(36).slice(2, 9)}`,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    const assistantId = `m_${Math.random().toString(36).slice(2, 9)}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString(), pending: true }]);
    setBusy(true);
    try {
      const res = await fetch('/api/agent/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not update the plan');
      setPlan(data.plan);
      setTrip(buildTripFromPlan(user ? 'preview' : 'guest', data.plan));
      updateAssistant(assistantId, { content: data.reply, pending: false });
    } catch (err) {
      updateAssistant(assistantId, { content: (err as Error).message, pending: false });
    } finally {
      setBusy(false);
    }
  }

  async function saveTrip() {
    if (!plan) return;
    setSaveState('saving');
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (res.status === 401) {
      setSaveState('auth');
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setSaveState('idle');
      return;
    }
    setSaveState('saved');
    router.push(`/trips/${data.trip.id}`);
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col lg:grid lg:grid-cols-[minmax(370px,410px)_minmax(0,1fr)]">
      {/* -------------------------------- CHAT -------------------------------- */}
      <section
        className={cn(
          'flex min-h-0 flex-col border-r border-line bg-parchment/40',
          mobileView === 'plan' && 'hidden lg:flex'
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-clay-200">
              <Sparkles size={14} />
            </span>
            <div>
              <p className="text-[13px] font-medium text-ink">Wayfarer agent</p>
              <p className="text-2xs text-ink-faint">{plan ? 'Plan in progress' : 'Ready to plan'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {plan ? (
              <button
                onClick={() => {
                  setPlan(null);
                  setTrip(null);
                  setMessages([]);
                  setMobileView('chat');
                }}
                className="btn-quiet text-2xs"
              >
                <RotateCcw size={12} /> New
              </button>
            ) : null}
            {plan ? (
              <button onClick={() => setMobileView('plan')} className="btn-quiet lg:hidden" aria-label="View plan">
                <PanelRight size={15} />
              </button>
            ) : null}
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-line bg-white p-4">
                <p className="font-display text-[22px] leading-snug text-ink">Tell me where you want to go.</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
                  I will research the destination, compare flights, shortlist stays, build a day-by-day plan and cost
                  everything — then you can change it by talking.
                </p>
              </div>
              <div>
                <p className="label-caps mb-2">Try one of these</p>
                <div className="space-y-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-left text-xs leading-relaxed text-ink-soft transition hover:border-clay-200 hover:text-ink"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-white/60 p-3 text-2xs leading-relaxed text-ink-faint">
                <span className="font-medium text-ink-mute">How this works:</span> six specialist agents run in
                sequence. Flight fares and hotel rates in this build are clearly-labelled demo data; weather is live.
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id}>
                {m.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[13px] leading-relaxed text-ivory">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <Avatar name={user?.name ?? 'Wayfarer'} color="#C05B34" size={26} />
                    <div className="min-w-0 flex-1 space-y-2">
                      {m.steps?.length ? <StepList steps={m.steps} /> : null}
                      {m.content ? (
                        <div className="rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
                          <RichText text={m.content} />
                        </div>
                      ) : null}
                      {m.pending ? (
                        <div className="dot-typing inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-ink-mute" />
                          <span className="h-1.5 w-1.5 rounded-full bg-ink-mute" />
                          <span className="h-1.5 w-1.5 rounded-full bg-ink-mute" />
                        </div>
                      ) : null}
                      {m.plan ? (
                        <div className="flex flex-wrap gap-1.5">
                          {m.plan.followUps.slice(0, 3).map((f) => (
                            <button
                              key={f}
                              onClick={() => refine(f)}
                              className="rounded-full border border-line bg-white px-2.5 py-1 text-2xs text-ink-mute transition hover:border-clay-200 hover:text-ink"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-line bg-parchment/70 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!value.trim()) return;
              if (plan) refine(value.trim());
              else send(value.trim());
            }}
            className="rounded-2xl border border-line bg-white p-1.5 shadow-card focus-within:border-clay-300 focus-within:ring-4 focus-within:ring-clay-50"
          >
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!value.trim()) return;
                  if (plan) refine(value.trim());
                  else send(value.trim());
                }
              }}
              rows={2}
              placeholder={plan ? 'Ask for a change — “make it cheaper”, “add a day in Kyoto”…' : 'Where do you want to go?'}
              className="max-h-28 min-h-[44px] w-full resize-none bg-transparent px-2.5 py-2 text-[13px] leading-relaxed outline-none placeholder:text-ink-faint"
            />
            <div className="flex items-center justify-between px-1 pb-0.5">
              <span className="text-[10px] text-ink-faint">{busy ? 'Agent is working…' : 'Enter to send · Shift+Enter for a new line'}</span>
              <button
                type="submit"
                disabled={busy || !value.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-ivory transition hover:bg-clay-600 disabled:opacity-40"
                aria-label="Send"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={15} />}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* -------------------------------- PLAN -------------------------------- */}
      <section className={cn('min-h-0 overflow-y-auto bg-ivory', mobileView === 'chat' && 'hidden lg:block')}>
        {trip ? (
          <div>
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ivory/95 px-4 py-2.5 backdrop-blur lg:px-6">
              <div className="flex items-center gap-2">
                <button onClick={() => setMobileView('chat')} className="btn-quiet lg:hidden" aria-label="Back to chat">
                  <ArrowLeft size={15} />
                </button>
                <div>
                  <p className="text-[13px] font-medium text-ink">
                    {trip.cities.map((c) => c.name).join(' · ')}
                  </p>
                  <p className="text-2xs text-ink-faint">
                    {fmtDate(trip.startDate, { day: 'numeric', month: 'short' })} – {fmtDate(trip.endDate, { day: 'numeric', month: 'short' })} ·{' '}
                    {trip.travelers} travellers · {inr(trip.budget.perPerson, { compact: true })} pp
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'hidden rounded-full border px-2.5 py-1 text-2xs font-medium sm:inline-flex',
                    trip.budget.estimatedTotal <= trip.budget.totalBudget
                      ? 'border-pine-100 bg-pine-50 text-pine-600'
                      : 'border-clay-200 bg-clay-50 text-clay-700'
                  )}
                >
                  {trip.budget.estimatedTotal <= trip.budget.totalBudget ? 'Within budget' : 'Over budget'}
                </span>
                {saveState === 'auth' ? (
                  <Link href="/login" className="btn-primary text-xs">
                    Sign in to save
                  </Link>
                ) : (
                  <button onClick={saveTrip} className="btn-primary text-xs" disabled={saveState === 'saving'}>
                    {saveState === 'saving' ? <Loader2 size={13} className="animate-spin" /> : <Bookmark size={13} />}
                    {saveState === 'saved' ? 'Saved' : 'Save trip'}
                  </button>
                )}
              </div>
            </div>
            <TripWorkspaceView trip={trip} onChange={setTrip} agentMode onRefine={refine} />
          </div>
        ) : (
          <EmptyCanvas />
        )}
      </section>
    </div>
  );
}

function StepList({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="rounded-2xl rounded-tl-md border border-line bg-white/70 px-3 py-2.5">
      <p className="label-caps mb-1.5">Agent activity</p>
      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start gap-2 text-2xs">
            <span className="mt-0.5 shrink-0">
              {s.status === 'done' ? (
                <Check size={11} className="text-pine-600" strokeWidth={3} />
              ) : s.status === 'error' ? (
                <AlertCircle size={11} className="text-clay-600" />
              ) : s.status === 'running' ? (
                <Loader2 size={11} className="animate-spin text-clay-500" />
              ) : (
                <Circle size={9} className="text-line-strong" />
              )}
            </span>
            <span className="min-w-0">
              <span className={cn('font-medium', s.status === 'running' ? 'text-ink' : 'text-ink-soft')}>
                {AGENT_LABEL[s.agent] ?? s.agent}
              </span>
              <span className="text-ink-faint"> · {s.label}</span>
              {s.detail ? <span className="block truncate text-ink-faint">{s.detail}</span> : null}
            </span>
            {s.ms ? <span className="ml-auto shrink-0 text-[9px] text-ink-faint">{(s.ms / 1000).toFixed(1)}s</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j} className="font-semibold text-ink">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

function EmptyCanvas() {
  const highlights = [
    { icon: Compass, title: 'Destination research', body: 'Seasonality, safety, visa notes and what is actually worth your time.' },
    { icon: Plane, title: 'Flight comparison', body: 'Cheapest, fastest and AI-recommended fares with baggage and layovers.' },
    { icon: BedDouble, title: 'Stay shortlisting', body: 'Ranked by price fit, guest score and walking distance to your days.' },
    { icon: CalendarDays, title: 'Day-by-day itinerary', body: 'Morning to evening, with transport, timings and costs.' },
    { icon: Wallet, title: 'Budget that keeps up', body: 'Every change re-prices the trip and flags where you can save.' },
  ];
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-white shadow-card">
          <Sparkles size={22} className="text-clay-500" />
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-clay-500" />
          </span>
        </div>
        <h2 className="font-display text-[28px] leading-tight text-ink">Your plan appears here</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-mute">
          Send a message and watch the specialists work. Everything is editable afterwards — nothing is locked in.
        </p>
        <div className="mt-7 space-y-2 text-left">
          {highlights.map((h) => (
            <div key={h.title} className="flex items-start gap-3 rounded-xl border border-line bg-white/70 px-3.5 py-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sand text-ink-soft">
                <h.icon size={12} />
              </span>
              <span>
                <span className="block text-[12px] font-medium text-ink">{h.title}</span>
                <span className="text-2xs text-ink-faint">{h.body}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
