import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const inr = (n: number, opts: { compact?: boolean } = {}) => {
  if (!isFinite(n)) return '₹0';
  if (opts.compact && Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (opts.compact && Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

export const inrPlain = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const pct = (n: number) => `${Math.round(n)}%`;

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', opts);

export const fmtDateLong = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const daysBetween = (a: string, b: string) =>
  Math.max(
    0,
    Math.round(
      (new Date(`${b.slice(0, 10)}T00:00:00`).getTime() - new Date(`${a.slice(0, 10)}T00:00:00`).getTime()) / 86400000
    )
  );

export const durationLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export function slugId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const k = key(item);
      (acc[k] ||= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

export const weatherIcon = (code: number) => {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2) return 'cloud-sun';
  if (code === 3 || code === 45 || code === 48) return 'cloud';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 95) return 'storm';
  return 'cloud-sun';
};

export const matchScoreLabel = (score: number) => (score >= 85 ? 'Excellent match' : score >= 70 ? 'Strong match' : 'Good match');
