'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Compass,
  Plane,
  BedDouble,
  Ticket,
  MapPinned,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  LifeBuoy,
} from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';

const NAV = [
  { href: '/plan', label: 'Plan a trip', icon: Sparkles, hint: 'Agent' },
  { href: '/explore', label: 'Destinations', icon: Compass },
  { href: '/flights', label: 'Flights', icon: Plane },
  { href: '/hotels', label: 'Stays', icon: BedDouble },
  { href: '/activities', label: 'Experiences', icon: Ticket },
  { href: '/trips', label: 'My trips', icon: MapPinned },
  { href: '/budget', label: 'Budget', icon: Wallet },
];

const MOBILE_NAV = NAV.filter((n) => ['/plan', '/explore', '/trips', '/flights'].includes(n.href));

export function AppShell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-ivory">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-parchment/80 backdrop-blur lg:flex">
        <div className="px-5 pb-5 pt-6">
          <Link href="/" aria-label="Wayfarer home">
            <Logo />
          </Link>
        </div>

        <div className="px-3">
          <Link
            href="/plan"
            className="group flex w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-card transition hover:border-clay-200 hover:shadow-lift"
          >
            <Sparkles size={15} className="text-clay-500" />
            New trip
            <span className="ml-auto rounded-md border border-line bg-sand px-1.5 py-0.5 text-2xs text-ink-faint">⌘K</span>
          </Link>
        </div>

        <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          <p className="label-caps px-3 pb-2">Workspace</p>
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                  active ? 'bg-ink text-ivory' : 'text-ink-soft hover:bg-sand hover:text-ink'
                )}
              >
                <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-clay-200' : 'text-ink-faint group-hover:text-ink-mute'} />
                {item.label}
                {item.hint ? (
                  <span
                    className={cn(
                      'ml-auto rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide',
                      active ? 'border-white/25 text-clay-100' : 'border-line text-ink-faint'
                    )}
                  >
                    {item.hint}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line px-3 py-3">
          {user ? (
            <Link
              href="/profile"
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition',
                isActive('/profile') ? 'bg-sand text-ink' : 'text-ink-soft hover:bg-sand'
              )}
            >
              <Avatar name={user.name} color={user.avatarColor} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{user.name}</span>
                <span className="block truncate text-2xs text-ink-faint">{user.email}</span>
              </span>
              <Settings size={14} className="text-ink-faint" />
            </Link>
          ) : (
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[12px] font-medium text-ink">Save your plans</p>
              <p className="mt-0.5 text-2xs text-ink-faint">Sign in to keep trips, budgets and chats.</p>
              <Link href="/login" className="mt-2 flex items-center justify-center rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-ivory hover:bg-clay-600">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ivory/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" aria-label="Home">
          <Logo compact />
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/plan" className="btn-quiet" aria-label="New trip">
            <Sparkles size={16} />
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Menu" className="btn-quiet">
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[280px] animate-fade-up bg-parchment p-5 shadow-lift">
            <div className="flex items-center justify-between">
              <Logo compact />
              <button onClick={() => setOpen(false)} className="btn-quiet" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <nav className="mt-6 space-y-1">
              {[...NAV, { href: '/profile', label: 'Profile & settings', icon: Settings }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm',
                    isActive(item.href) ? 'bg-ink text-ivory' : 'text-ink-soft hover:bg-sand'
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      <main className="lg:pl-[248px]">
        <div className="min-h-screen pb-20 lg:pb-0">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-line bg-parchment/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium', active ? 'text-clay-600' : 'text-ink-mute')}
            >
              <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {item.label.split(' ')[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-parchment/60">
      <div className="container-page py-7 lg:py-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {eyebrow ? <p className="label-caps mb-2">{eyebrow}</p> : null}
            <h1 className="font-display text-[30px] leading-tight text-ink lg:text-[38px]">{title}</h1>
            {description ? <p className="mt-2 max-w-2xl text-sm text-ink-mute">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      }}
      className="inline-flex items-center gap-2 text-sm text-ink-mute hover:text-ink"
    >
      <LogOut size={14} />
      Sign out
    </button>
  );
}

export function HelpLink() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
      <LifeBuoy size={13} /> Help
    </span>
  );
}

export function SearchButton() {
  return (
    <span className="hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink-faint md:inline-flex">
      <Search size={13} /> Search trips, stays, cities
    </span>
  );
}
