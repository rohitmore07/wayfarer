'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/explore', label: 'Destinations' },
  { href: '/flights', label: 'Flights' },
  { href: '/hotels', label: 'Stays' },
  { href: '/activities', label: 'Experiences' },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/80 backdrop-blur-xl">
      <div className="container-page flex h-[68px] items-center justify-between">
        <div className="flex items-center gap-9">
          <Link href="/" aria-label="Wayfarer home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-ink-soft transition hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-2.5 md:flex">
          {signedIn ? (
            <>
              <Link href="/trips" className="btn-ghost">
                My trips
              </Link>
              <Link href="/plan" className="btn-primary">
                Plan a trip
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-quiet px-4">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Start planning
              </Link>
            </>
          )}
        </div>
        <button className="btn-quiet md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <div className={cn('overflow-hidden border-t border-line bg-ivory md:hidden', open ? 'block' : 'hidden')}>
        <div className="container-page space-y-1 py-4">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-2 py-2.5 text-sm text-ink-soft hover:bg-sand">
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link href="/login" className="btn-ghost flex-1">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary flex-1">
              Start free
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-parchment">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-mute">
              Your next adventure starts with a conversation. Wayfarer plans flights, stays, days and budgets in one
              place — and keeps every estimate honest.
            </p>
          </div>
          {[
            { title: 'Plan', links: [['AI trip planner', '/plan'], ['Destinations', '/explore'], ['Budget planner', '/budget']] },
            { title: 'Book', links: [['Flights', '/flights'], ['Stays', '/hotels'], ['Experiences', '/activities']] },
            { title: 'Account', links: [['My trips', '/trips'], ['Profile', '/profile'], ['Sign in', '/login']] },
          ].map((col) => (
            <div key={col.title}>
              <p className="label-caps">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-ink-soft hover:text-ink">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Wayfarer AI. A product demonstration — fares and rates are sample data.</p>
          <p className="flex items-center gap-4">
            <span>Made for travellers in India</span>
            <span className="hidden h-1 w-1 rounded-full bg-ink-faint sm:block" />
            <span>Prices in ₹ INR</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
