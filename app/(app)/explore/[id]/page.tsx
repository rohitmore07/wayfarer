import { SafeImage } from '@/components/ui/SafeImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarDays, Plane, ShieldCheck, Sparkles, Wallet, MapPin } from 'lucide-react';
import { cityById } from '@/lib/data/cities';
import { hotelsByCity } from '@/lib/data/hotels';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Badge, FadeIn, Rating, Stars } from '@/components/ui';
import { inr } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const city = cityById(id);
  return { title: city ? `${city.name} — Wayfarer` : 'Destination — Wayfarer' };
}

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const city = cityById(id);
  if (!city) notFound();
  const hotels = hotelsByCity(city.id);

  const maxHigh = Math.max(...city.climate.map((c) => c.highC));

  return (
    <div>
      <div className="relative h-[320px] w-full overflow-hidden sm:h-[400px]">
        <SafeImage src={city.heroImage} alt={city.name} fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10" />
        <div className="container-page relative flex h-full flex-col justify-end pb-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-2xs uppercase tracking-[0.16em] text-white/70">{city.country} · {city.region.replace('-', ' ')}</p>
              <h1 className="mt-2 font-display text-[40px] leading-none text-white sm:text-[54px]">{city.name}</h1>
              <p className="mt-3 max-w-xl text-sm text-white/80">{city.tagline}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {city.interests.slice(0, 5).map((i) => (
                  <span key={i} className="rounded-full bg-white/15 px-2.5 py-1 text-2xs capitalize text-white/90 backdrop-blur">{i}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/plan?q=${encodeURIComponent(`Plan ${city.name}, ${city.country} for 6 days`)}`} className="btn-clay px-5 py-3">
                <Sparkles size={14} /> Plan a trip here
              </Link>
              <Link href={`/flights?to=${city.id}`} className="btn border border-white/25 px-5 py-3 text-white hover:bg-white/10">
                <Plane size={14} /> Flights
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-2xl text-ink">Why go</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{city.description}</p>
          </section>

          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl text-ink">Things to do</h2>
              <Link href={`/activities?city=${city.id}`} className="text-xs font-medium text-clay-600 hover:underline">
                See all {city.pois.length}
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {city.pois.slice(0, 6).map((p) => (
                <ActivityCard key={p.id} poi={p} cityName={city.name} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Where to stay</h2>
            <p className="mt-1 text-xs text-ink-mute">Three tiers, all scored for proximity to the sights above.</p>
            <div className="mt-4 space-y-2">
              {hotels.slice(0, 4).map((h) => (
                <div key={h.id} className="flex gap-3 rounded-xl border border-line bg-white p-3">
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg">
                    <SafeImage src={h.images[0]} alt={h.name} fill className="object-cover" sizes="96px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Stars n={h.stars} />
                      <span className="text-2xs text-ink-faint">· {h.area}</span>
                    </div>
                    <p className="truncate text-[13px] font-medium text-ink">{h.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-2xs text-ink-mute">{h.description}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <Rating value={h.rating} count={h.reviewCount} />
                      <span className="text-xs font-medium text-ink">{inr(h.pricePerNight)}<span className="text-2xs font-normal text-ink-faint">/night</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href={`/hotels?city=${city.id}`} className="btn-ghost mt-3 text-xs">
              Compare all stays <ArrowRight size={13} />
            </Link>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Local knowledge</h2>
            <ul className="mt-3 space-y-2">
              {city.localTips.map((t) => (
                <li key={t} className="flex items-start gap-2.5 rounded-xl bg-parchment px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-400" />
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="label-caps">Costs per person / day</p>
            <div className="mt-3 space-y-2">
              {[
                ['Budget', city.dailyBudget.budget],
                ['Comfort', city.dailyBudget.comfort],
                ['Luxury', city.dailyBudget.luxury],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between text-xs">
                  <span className="text-ink-mute">{label}</span>
                  <span className="font-medium text-ink">{inr(value as number)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-2xs text-ink-faint">Excludes flights and accommodation.</p>
            <div className="mt-4 space-y-2 border-t border-line pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-ink-mute"><Wallet size={12} /> Hotel, comfort tier</span>
                <span className="font-medium text-ink">{inr(city.hotelNight.comfort)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-ink-mute"><Plane size={12} /> Airport</span>
                <span className="font-medium text-ink">{city.airportCode}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="label-caps flex items-center gap-1.5"><CalendarDays size={11} /> When to go</p>
            <div className="mt-3 flex items-end gap-1">
              {city.climate.map((c, i) => {
                const best = city.bestMonths.includes(c.month);
                return (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className={`mx-auto w-full rounded-t ${best ? 'bg-clay-400' : 'bg-sand'}`}
                      style={{ height: `${(c.highC / maxHigh) * 56 + 8}px` }}
                      title={`${c.highC}°C / ${c.lowC}°C · ${c.rainMm}mm`}
                    />
                    <span className={`mt-1 block text-[9px] ${best ? 'font-semibold text-ink' : 'text-ink-faint'}`}>{MONTHS[i]}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-2xs text-ink-mute">
              Best months: <span className="font-medium text-ink">{city.bestMonths.map((m) => new Date(2026, m - 1).toLocaleDateString('en-IN', { month: 'long' })).join(', ')}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="label-caps flex items-center gap-1.5"><ShieldCheck size={11} /> Safety</p>
              <Badge tone={city.safety.level === 'very safe' ? 'pine' : 'gold'}>{city.safety.level}</Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-mute">{city.safety.summary}</p>
            <div className="mt-3 grid grid-cols-3 gap-1 border-t border-line pt-3 text-center">
              {[['Police', city.safety.emergency.police], ['Ambulance', city.safety.emergency.ambulance], ['Tourist', city.safety.emergency.tourist ?? '—']].map(([l, v]) => (
                <div key={l}>
                  <p className="text-[9px] uppercase tracking-wide text-ink-faint">{l}</p>
                  <p className="text-xs font-medium text-ink">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-parchment p-5">
            <p className="label-caps flex items-center gap-1.5"><MapPin size={11} /> Entry requirements</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">{city.visaNote}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
