import { Plane, ShieldCheck, Bell } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { FlightSearch } from '@/components/search/FlightSearch';
import { cityById } from '@/lib/data/cities';

export const metadata = { title: 'Flight search — Wayfarer' };

export default async function FlightsPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  const city = to ? cityById(to) : undefined;
  return (
    <div>
      <PageHeader
        eyebrow="Flight search"
        title="Compare every sensible way to get there"
        description="One-way and round-trip fares with stops, layovers, baggage and cabin detail. Cheapest, fastest and AI-recommended options are labelled."
      />
      <div className="container-page py-6">
        <FlightSearch defaultDestination={city?.airportCode} />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Plane, title: 'Provider adapter', body: 'Amadeus Self-Service is wired in — add credentials to .env and the same UI returns live, bookable fares.' },
            { icon: ShieldCheck, title: 'No invented availability', body: 'Demo fares are labelled "Demo data" and there is no booking confirmation unless a provider returns one.' },
            { icon: Bell, title: 'Price insight', body: 'Fares are modelled on route distance, season and cabin so you can still sense-check a budget.' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-line bg-white p-4">
              <f.icon size={15} className="text-clay-500" />
              <p className="mt-2 text-[13px] font-medium text-ink">{f.title}</p>
              <p className="mt-1 text-2xs leading-relaxed text-ink-mute">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
