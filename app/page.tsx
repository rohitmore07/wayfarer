import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  ArrowRight,
  Sparkles,
  Plane,
  BedDouble,
  MapPinned,
  Wallet,
  CloudSun,
  Backpack,
  ShieldCheck,
  Compass,
  Check,
  Route,
  MessageSquareQuote,
} from 'lucide-react';
import { SiteHeader, SiteFooter } from '@/components/marketing/SiteHeader';
import { HeroPrompt } from '@/components/marketing/HeroPrompt';
import { FadeIn, ProvenanceBadge } from '@/components/ui';
import { CITIES } from '@/lib/data/cities';
import { unsplash, PHOTOS } from '@/lib/data/unsplash';
import { getCurrentUser } from '@/lib/auth/session';
import { inr } from '@/lib/utils';

const FEATURED = ['tokyo', 'bali', 'paris', 'reykjavik', 'dubai', 'jaipur'];

const AGENTS = [
  { name: 'Travel Planning Agent', role: 'Orchestrates the whole trip', icon: Sparkles },
  { name: 'Flight Search Agent', role: 'Compares carriers, stops and fares', icon: Plane },
  { name: 'Hotel Recommendation Agent', role: 'Matches stays to your route', icon: BedDouble },
  { name: 'Destination Research Agent', role: 'Finds what is actually worth your time', icon: Compass },
  { name: 'Itinerary Agent', role: 'Builds a route that makes geographic sense', icon: Route },
  { name: 'Budget Agent', role: 'Costs it out and finds savings', icon: Wallet },
];

const CAPABILITIES = [
  { icon: Plane, title: 'Flight comparison', body: 'Cheapest, fastest and best-value fares side by side, with baggage and layover detail.' },
  { icon: BedDouble, title: 'Stay shortlisting', body: 'Hotels ranked by price fit, guest score and walking distance to your actual itinerary.' },
  { icon: MapPinned, title: 'Day-by-day itinerary', body: 'Morning, afternoon and evening plans with transport, timings and costs — draggable.' },
  { icon: Wallet, title: 'Live budget tracking', body: 'Every change re-prices the trip. Warnings and savings suggestions as you go.' },
  { icon: CloudSun, title: 'Weather-aware', body: 'Live forecasts and climate normals move outdoor plans when rain is likely.' },
  { icon: Backpack, title: 'Packing & safety', body: 'Checklists generated for your season, plus destination-specific safety briefings.' },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const featured = FEATURED.map((id) => CITIES.find((c) => c.id === id)!).filter(Boolean);

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader signedIn={Boolean(user)} />

      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_75%_-10%,#F6E7DE_0%,transparent_60%)]" />
        <div className="container-page grid items-center gap-14 pb-16 pt-14 lg:grid-cols-[1.06fr_0.94fr] lg:pb-24 lg:pt-20">
          <div>
            <FadeIn>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-medium text-ink-soft">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay-500" />
                </span>
                Six specialist agents, one conversation
              </span>
            </FadeIn>

            <FadeIn delay={0.05}>
              <h1 className="mt-6 max-w-[620px] font-display text-[44px] leading-[1.03] tracking-[-0.02em] text-ink sm:text-[58px] lg:text-[64px]">
                Your next adventure
                <br />
                starts with a
                <span className="relative mx-2 inline-block">
                  <span className="relative z-10 italic text-clay-600">conversation.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none" preserveAspectRatio="none">
                    <path d="M2 7c40-5 90-6 196-2" stroke="#E0A189" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="mt-6 max-w-[500px] text-[15px] leading-relaxed text-ink-mute">
                From finding flights and stays to crafting unforgettable experiences, let AI plan your entire journey.
                Tell Wayfarer what you love — it handles the research, the routing and the maths.
              </p>
            </FadeIn>

            <FadeIn delay={0.15} className="mt-8">
              <HeroPrompt />
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-ink-mute">
                <span className="inline-flex items-center gap-1.5">
                  <Check size={13} className="text-pine-600" /> No booking fees
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check size={13} className="text-pine-600" /> Live weather & climate data
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check size={13} className="text-pine-600" /> Every price labelled
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Hero visual */}
          <FadeIn delay={0.15} y={24} className="relative">
            <div className="relative mx-auto max-w-[520px]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-line shadow-lift">
                <SafeImage
                  src={unsplash(PHOTOS.japanFuji, 1200)}
                  alt="Mount Fuji behind Chureito Pagoda in spring"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 90vw, 520px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/5 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-white/85 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xs uppercase tracking-[0.14em] text-ink-faint">Planned in 48 seconds</p>
                      <p className="mt-0.5 font-display text-lg text-ink">Tokyo · Kyoto · Osaka</p>
                    </div>
                    <span className="rounded-full bg-ink px-3 py-1 text-2xs font-medium text-ivory">7 days</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-2xs text-ink-mute">
                    <span className="inline-flex items-center gap-1">
                      <Plane size={11} /> ANA non-stop
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BedDouble size={11} /> 6 nights
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Wallet size={11} /> ₹1.42L pp
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating agent card */}
              <div className="absolute -left-4 top-8 hidden w-[210px] rounded-2xl border border-line bg-white/95 p-3.5 shadow-lift backdrop-blur sm:block">
                <p className="label-caps">Agent status</p>
                <div className="mt-2.5 space-y-2">
                  {[
                    ['Flights', '9 options compared', true],
                    ['Stays', 'Gion ryokan shortlist', true],
                    ['Itinerary', 'Day 3 routing…', false],
                  ].map(([label, detail, done]) => (
                    <div key={label as string} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                          done ? 'bg-pine-600 text-white' : 'border border-clay-300 bg-clay-50'
                        }`}
                      >
                        {done ? <Check size={8} strokeWidth={3} /> : <span className="h-1 w-1 animate-pulse rounded-full bg-clay-500" />}
                      </span>
                      <span className="text-[11px] leading-tight text-ink-soft">
                        <span className="block font-medium text-ink">{label}</span>
                        {detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -right-3 top-[38%] hidden rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-lift sm:block">
                <p className="text-2xs text-ink-faint">Budget check</p>
                <p className="font-display text-lg text-pine-600">₹8,200 under target</p>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* stat strip */}
        <div className="border-y border-line bg-parchment/70">
          <div className="container-page grid grid-cols-2 divide-line py-6 sm:grid-cols-4 sm:divide-x">
            {[
              ['14', 'curated destinations'],
              ['6', 'specialist agents'],
              ['120+', 'experiences & stays'],
              ['₹ INR', 'built for Indian travellers'],
            ].map(([value, label]) => (
              <div key={label} className="px-2 py-2 text-center sm:py-0">
                <p className="font-display text-2xl text-ink">{value}</p>
                <p className="mt-1 text-2xs uppercase tracking-[0.12em] text-ink-faint">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- How it works --------------------------- */}
      <section className="container-page py-20 lg:py-24">
        <FadeIn>
          <div className="max-w-2xl">
            <p className="label-caps">How it works</p>
            <h2 className="mt-3 font-display text-[34px] leading-[1.1] text-ink sm:text-[42px]">
              One message. A complete, costed, bookable-looking plan.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-mute">
              Wayfarer is not a chatbot that writes paragraphs. It runs a pipeline: parse intent, research the
              destination, compare flights, shortlist stays, build a geographically sensible itinerary, then cost the
              whole thing and tell you where you can save.
            </p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { n: '01', title: 'Say it in your own words', body: '“Japan in March, 7 days, ₹1.5L each, love food and photography.” Dates, budget and travellers can be fuzzy — the agent asks only what it truly needs.', icon: MessageSquareQuote },
            { n: '02', title: 'Watch the agents work', body: 'Each specialist reports back in the open: what it found, how many options it compared, and whether the data is live, estimated or demo.', icon: Sparkles },
            { n: '03', title: 'Refine by talking', body: '“Make it cheaper.” “Add a day in Kyoto.” “No early mornings.” The agent edits only the parts that need to change — and re-prices the trip.', icon: Route },
          ].map((step, i) => (
            <FadeIn key={step.n} delay={i * 0.08}>
              <div className="group relative h-full rounded-2xl border border-line bg-white p-6 transition hover:border-line-strong hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sand text-ink-soft">
                    <step.icon size={16} />
                  </span>
                  <span className="font-display text-2xl text-line-strong">{step.n}</span>
                </div>
                <h3 className="mt-4 font-display text-xl text-ink">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-mute">{step.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* --------------------------- Destinations --------------------------- */}
      <section className="border-y border-line bg-parchment/60 py-20 lg:py-24">
        <div className="container-page">
          <FadeIn className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-caps">Destination explorer</p>
              <h2 className="mt-3 font-display text-[34px] leading-tight text-ink sm:text-[42px]">Where will it be this year?</h2>
            </div>
            <Link href="/explore" className="btn-ghost">
              Explore all destinations <ArrowRight size={14} />
            </Link>
          </FadeIn>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((city, i) => (
              <FadeIn key={city.id} delay={i * 0.05}>
                <Link
                  href={`/explore/${city.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-line bg-white"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SafeImage
                      src={city.heroImage}
                      alt={city.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 380px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                    <div className="absolute inset-x-4 bottom-3 flex items-end justify-between">
                      <div>
                        <p className="text-2xs uppercase tracking-[0.14em] text-white/70">{city.country}</p>
                        <p className="font-display text-2xl text-white">{city.name}</p>
                      </div>
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-2xs font-medium text-ink backdrop-blur">
                        {city.bestMonths.slice(0, 3).map((m) => new Date(2026, m - 1).toLocaleDateString('en-IN', { month: 'short' })).join(' · ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="line-clamp-1 pr-3 text-xs text-ink-mute">{city.tagline}</p>
                    <p className="shrink-0 text-2xs text-ink-faint">
                      from <span className="font-medium text-ink">{inr(city.dailyBudget.comfort, { compact: true })}</span>/day
                    </p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ Agents ------------------------------ */}
      <section className="relative overflow-hidden bg-pine-900 py-20 text-ivory lg:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="container-page relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <FadeIn>
            <p className="text-2xs uppercase tracking-[0.16em] text-pine-300">Agent architecture</p>
            <h2 className="mt-3 font-display text-[34px] leading-[1.08] sm:text-[42px]">
              Not one model guessing.
              <br />
              Six agents with jobs.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-pine-100/80">
              The planning agent orchestrates specialised tools, validates their JSON, and merges the results into a
              single trip. If a provider fails, it falls back gracefully and tells you which numbers changed.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <ProvenanceBadge kind="live" />
              <ProvenanceBadge kind="estimated" />
              <ProvenanceBadge kind="ai" />
              <ProvenanceBadge kind="mock" />
            </div>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-pine-100/60">
              Every figure in the product carries one of these labels. Nothing is presented as bookable unless the
              provider confirms it.
            </p>
          </FadeIn>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {AGENTS.map((a, i) => (
              <FadeIn key={a.name} delay={i * 0.05}>
                <div className="flex h-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.07]">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-clay-200">
                    <a.icon size={15} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-ivory">{a.name}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-pine-100/60">{a.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Capabilities --------------------------- */}
      <section className="container-page py-20 lg:py-24">
        <FadeIn className="max-w-2xl">
          <p className="label-caps">Everything in one workspace</p>
          <h2 className="mt-3 font-display text-[34px] leading-tight text-ink sm:text-[42px]">
            The whole trip, not just the destination.
          </h2>
        </FadeIn>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.04}>
              <div className="h-full rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-card">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-clay-50 text-clay-600">
                  <f.icon size={17} />
                </span>
                <h3 className="mt-4 text-[15px] font-medium text-ink">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-mute">{f.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ----------------------------- Showcase ----------------------------- */}
      <section className="border-y border-line bg-parchment/60 py-20 lg:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <p className="label-caps">Inside a trip workspace</p>
            <h2 className="mt-3 font-display text-[34px] leading-[1.1] text-ink sm:text-[42px]">
              Every day, costed and mapped.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-mute">
              Morning, afternoon and evening activities with realistic transfer times, a dinner worth the walk, and a
              budget that updates the moment you swap a hotel or drop a museum.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Drag activities between days — costs re-calculate instantly',
                'Rain forecast? Indoor alternatives surfaced for that day',
                'Regenerate a single day without touching the rest',
                'Safety briefings and packing lists generated per destination',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
                  <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-pine-600/10 text-pine-600">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/plan" className="btn-primary mt-8">
              Try the planner <ArrowRight size={14} />
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-line bg-white p-4 shadow-lift">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <p className="text-2xs uppercase tracking-[0.14em] text-ink-faint">Day 4 · Kyoto</p>
                  <p className="font-display text-lg text-ink">Higashiyama & Gion</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-2xs text-ink-mute">
                  <CloudSun size={11} /> 17° / 8° · light rain
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  ['09:00', 'Kiyomizu-dera & Sannenzaka', '2h', '₹400'],
                  ['11:30', 'Tea ceremony, machiya townhouse', '1h 15m', '₹2,800'],
                  ['13:10', 'Nishiki Market food walk', '1h 30m', '₹1,800'],
                  ['19:00', 'Dinner at Gion Kappa', '—', '₹2,200'],
                ].map(([time, name, dur, cost], idx) => (
                  <div key={name} className="flex items-center gap-3 rounded-xl border border-line/70 bg-parchment/50 px-3 py-2.5">
                    <span className="w-10 shrink-0 text-2xs font-medium text-ink-faint">{time}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">{name}</span>
                      <span className="text-2xs text-ink-faint">{idx === 0 ? 'Start from hotel · 12 min walk' : dur}</span>
                    </span>
                    <span className="shrink-0 text-2xs text-ink-mute">{cost}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-sand px-3 py-2.5">
                <span className="text-2xs text-ink-mute">Day estimate</span>
                <span className="text-sm font-medium text-ink">₹7,840</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ---------------------------- Honesty ------------------------------- */}
      <section className="container-page py-20">
        <div className="grid gap-6 rounded-3xl border border-line bg-white p-8 lg:grid-cols-[1fr_1.2fr] lg:p-12">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine-600">
              <ShieldCheck size={19} />
            </span>
            <h2 className="mt-5 font-display text-[30px] leading-tight text-ink">
              It tells you what it doesn’t know.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-mute">
              Live fares, climate estimates, AI suggestions and demo inventory look different — because they are
              different. Wayfarer never claims a booking exists until the provider confirms it.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['live', 'Live', 'Pulled from a provider moments ago. Weather is a real forecast, not a guess.'],
              ['estimated', 'Estimated', 'Modelled from climate normals and fare curves. Directionally right, not a quote.'],
              ['ai', 'AI recommendation', 'A judgement call from the planning agent — weighed against your brief.'],
              ['mock', 'Demo data', 'Sample inventory for this build. Swap in a provider key to go live.'],
            ].map(([kind, title, body]) => (
              <div key={kind} className="rounded-xl border border-line bg-parchment/60 p-4">
                <ProvenanceBadge kind={kind as never} />
                <p className="mt-2 text-[13px] font-medium text-ink">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-mute">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Testimonials --------------------------- */}
      <section className="container-page pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { q: 'I described a vague idea — cold, aurora, five days, ₹2L — and got a real plan with two hotels and a day-by-day route in under a minute.', n: 'Ritika S.', c: 'Nashik · Iceland trip' },
            { q: 'The “make it cheaper” button actually worked. It swapped the flight and moved the hotel a neighbourhood over, and told me exactly what changed.', n: 'Karthik R.', c: 'Bengaluru · Japan trip' },
            { q: 'Being able to see which prices were live and which were estimates made me trust it far more than the usual travel chatbot.', n: 'Aarti M.', c: 'Mumbai · Europe trip' },
          ].map((t, i) => (
            <FadeIn key={t.n} delay={i * 0.06}>
              <figure className="h-full rounded-2xl border border-line bg-white p-6">
                <div className="flex gap-0.5 text-gold-500">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <span key={k}>★</span>
                  ))}
                </div>
                <blockquote className="mt-4 text-[13px] leading-relaxed text-ink-soft">“{t.q}”</blockquote>
                <figcaption className="mt-5 border-t border-line pt-4 text-xs">
                  <span className="font-medium text-ink">{t.n}</span>
                  <span className="block text-ink-faint">{t.c}</span>
                </figcaption>
              </figure>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ------------------------------- CTA -------------------------------- */}
      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center text-ivory lg:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <SafeImage src={unsplash(PHOTOS.kyoto, 1600)} alt="" fill className="object-cover" sizes="100vw" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-[34px] leading-[1.08] sm:text-[46px]">Where do you want to wake up next?</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ivory/70">
              Tell us where you want to go. Your AI travel agent handles the rest — flights, stays, days and the budget
              to match.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/plan" className="btn-clay px-6 py-3">
                Plan My Trip <ArrowRight size={15} />
              </Link>
              <Link href="/explore" className="btn border border-white/25 px-6 py-3 text-ivory hover:bg-white/10">
                Explore Destinations
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
