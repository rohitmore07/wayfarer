'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PROVENANCE_LABEL, type Provenance } from '@/lib/types';
import { Check, Sparkles, Radio, Calculator, FlaskConical, Star } from 'lucide-react';
import { forwardRef } from 'react';

/* ------------------------------- Provenance ------------------------------- */

const PROV_STYLE: Record<Provenance, { cls: string; Icon: typeof Check }> = {
  live: { cls: 'border-pine-100 bg-pine-50 text-pine-600', Icon: Radio },
  estimated: { cls: 'border-line bg-sand text-ink-mute', Icon: Calculator },
  ai: { cls: 'border-clay-100 bg-clay-50 text-clay-700', Icon: Sparkles },
  mock: { cls: 'border-line bg-white text-ink-faint', Icon: FlaskConical },
};

export function ProvenanceBadge({
  kind,
  label,
  className,
  compact,
}: {
  kind: Provenance;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const { cls, Icon } = PROV_STYLE[kind];
  return (
    <span
      title={
        kind === 'live'
          ? 'Verified live data from a provider'
          : kind === 'estimated'
            ? 'Estimated from climate/budget models'
            : kind === 'ai'
              ? 'AI-generated recommendation'
              : 'Demo dataset — connect a provider for live data'
      }
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium',
        cls,
        className
      )}
    >
      <Icon size={10} strokeWidth={2.2} />
      {compact ? null : label ?? PROVENANCE_LABEL[kind]}
    </span>
  );
}

/* --------------------------------- Rating --------------------------------- */

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft', className)}>
      <span className="inline-flex items-center gap-0.5 rounded-md bg-pine-600 px-1.5 py-0.5 text-2xs font-semibold text-white">
        {value.toFixed(1)}
      </span>
      {count ? <span className="text-ink-faint">({count.toLocaleString('en-IN')})</span> : null}
    </span>
  );
}

export function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${n} star`}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={11} className="fill-gold-500 text-gold-500" />
      ))}
    </span>
  );
}

/* --------------------------------- Buttons -------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'clay' | 'ghost' | 'quiet' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, children, ...props },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.985]';
  const variants = {
    primary: 'bg-ink text-ivory hover:bg-clay-600',
    clay: 'bg-clay-500 text-white hover:bg-clay-600',
    ghost: 'border border-line bg-white text-ink-soft hover:border-line-strong hover:text-ink',
    quiet: 'text-ink-mute hover:bg-sand hover:text-ink',
    dark: 'bg-pine-700 text-ivory hover:bg-pine-900',
  };
  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-[15px]',
  };
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
});

/* ---------------------------------- Misc ---------------------------------- */

export function Badge({ children, className, tone = 'neutral' }: { children: React.ReactNode; className?: string; tone?: 'neutral' | 'clay' | 'pine' | 'gold' }) {
  const tones = {
    neutral: 'border-line bg-white text-ink-mute',
    clay: 'border-clay-100 bg-clay-50 text-clay-700',
    pine: 'border-pine-100 bg-pine-50 text-pine-600',
    gold: 'border-gold-400/30 bg-gold-400/10 text-gold-600',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />;
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('label-caps', className)}>{children}</p>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer-track rounded-lg bg-sand', className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-sand text-ink-mute">
        <Icon size={18} />
      </span>
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-mute">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className,
  y = 12,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className="label-caps">{label}</p>
      <p className="mt-1 font-display text-2xl leading-none text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function Avatar({ name, color, size = 32 }: { name: string; color?: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{ width: size, height: size, backgroundColor: color ?? '#C05B34', fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}
