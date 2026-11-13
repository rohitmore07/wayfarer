'use client';

import { AlertTriangle, ArrowDownRight, Lightbulb, Plane, BedDouble, UtensilsCrossed, TrainFront, Ticket, ShoppingBag, FileCheck2 } from 'lucide-react';
import type { BudgetPlan } from '@/lib/types';
import { cn, inr } from '@/lib/utils';
import { ProvenanceBadge } from '@/components/ui';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  flights: Plane,
  stay: BedDouble,
  food: UtensilsCrossed,
  transport: TrainFront,
  activities: Ticket,
  shopping: ShoppingBag,
  misc: FileCheck2,
};

const COLORS: Record<string, string> = {
  flights: '#1F4A43',
  stay: '#C05B34',
  food: '#C99A4B',
  transport: '#3F6E8C',
  activities: '#8A3A20',
  shopping: '#8FB0A8',
  misc: '#D8D0C0',
};

export function BudgetDonut({ plan, size = 190 }: { plan: BudgetPlan; size?: number }) {
  const total = plan.categories.reduce((s, c) => s + c.total, 0) || 1;
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3EFE7" strokeWidth="14" />
        {plan.categories.map((c) => {
          const len = (c.total / total) * circumference;
          const el = (
            <circle
              key={c.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={COLORS[c.key]}
              strokeWidth="14"
              strokeDasharray={`${Math.max(0, len - 2)} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xs uppercase tracking-[0.12em] text-ink-faint">Estimated</p>
        <p className="font-display text-[26px] leading-none text-ink">{inr(plan.estimatedTotal, { compact: true })}</p>
        <p className="mt-1 text-2xs text-ink-mute">of {inr(plan.totalBudget, { compact: true })} budget</p>
      </div>
    </div>
  );
}

export function BudgetPanel({
  plan,
  days,
  travelers,
  onOptimise,
  compact,
}: {
  plan: BudgetPlan;
  days: number;
  travelers: number;
  onOptimise?: () => void;
  compact?: boolean;
}) {
  const total = plan.categories.reduce((s, c) => s + c.total, 0) || 1;
  const utilisation = Math.min(140, (plan.estimatedTotal / Math.max(1, plan.totalBudget)) * 100);
  const over = plan.estimatedTotal > plan.totalBudget;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className={cn('flex flex-col items-center rounded-2xl border border-line bg-white p-5', compact && 'p-4')}>
          <BudgetDonut plan={plan} size={compact ? 160 : 190} />
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between text-2xs text-ink-mute">
              <span>Budget used</span>
              <span className={cn('font-medium', over ? 'text-clay-600' : 'text-pine-600')}>{Math.round(utilisation)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand">
              <div
                className={cn('h-full rounded-full transition-all', over ? 'bg-clay-500' : 'bg-pine-600')}
                style={{ width: `${Math.min(100, utilisation)}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              <div>
                <p className="font-display text-base text-ink">{inr(plan.perPerson, { compact: true })}</p>
                <p className="text-[10px] text-ink-faint">per person</p>
              </div>
              <div className="border-x border-line">
                <p className="font-display text-base text-ink">{inr(plan.daily ?? 0, { compact: true })}</p>
                <p className="text-[10px] text-ink-faint">per day</p>
              </div>
              <div>
                <p className="font-display text-base text-ink">{days}n</p>
                <p className="text-[10px] text-ink-faint">{travelers} pax</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="label-caps">Where the money goes</p>
            <ProvenanceBadge kind={plan.provenance} />
          </div>
          <ul className="mt-3 space-y-2.5">
            {plan.categories.map((c) => {
              const Icon = ICONS[c.key] ?? Ticket;
              const share = (c.total / total) * 100;
              return (
                <li key={c.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-ink-soft">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md" style={{ backgroundColor: `${COLORS[c.key]}1a`, color: COLORS[c.key] }}>
                        <Icon size={11} />
                      </span>
                      {c.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-2xs text-ink-faint">{share.toFixed(0)}%</span>
                      <span className="w-[74px] text-right font-medium text-ink">{inr(c.total)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: COLORS[c.key] }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {plan.warnings.length ? (
        <div className="rounded-2xl border border-clay-200 bg-clay-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-clay-700">
            <AlertTriangle size={13} /> Budget warnings
          </p>
          <ul className="mt-2 space-y-1.5">
            {plan.warnings.map((w) => (
              <li key={w} className="text-xs leading-relaxed text-clay-700/90">
                • {w}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.savings.length ? (
        <div className="rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Lightbulb size={13} className="text-gold-500" /> AI savings suggestions
            </p>
            {onOptimise ? (
              <button onClick={onOptimise} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-2xs font-medium text-ivory hover:bg-clay-600">
                Apply optimisations
              </button>
            ) : null}
          </div>
          <ul className="mt-3 divide-y divide-line">
            {plan.savings.map((s) => (
              <li key={s.title} className="flex items-start justify-between gap-3 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-ink">{s.title}</p>
                  <p className="mt-0.5 text-2xs leading-relaxed text-ink-mute">{s.detail}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-pine-50 px-2 py-1 text-2xs font-medium text-pine-600">
                  <ArrowDownRight size={10} /> {inr(s.savingINR, { compact: true })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
