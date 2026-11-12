import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/AppShell';
import { BudgetCalculator } from '@/components/budget/BudgetCalculator';
import { getCurrentUser } from '@/lib/auth/session';
import { listTrips } from '@/lib/db/store';
import { budgetUtilisation } from '@/lib/agent/budget';
import { cn, fmtDate, inr } from '@/lib/utils';

export const metadata = { title: 'Budget planner — Wayfarer' };

export default async function BudgetPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const trips = listTrips(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="Budget planner"
        title="Know the number before you commit"
        description="Model a trip's total cost in seconds, then watch every saved trip's utilisation so nothing surprises you at checkout."
      />
      <div className="container-page space-y-8 py-6">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-xl text-ink">Trip budgets</h2>
            <Link href="/plan" className="text-xs font-medium text-clay-600 hover:underline">Plan a new trip →</Link>
          </div>
          {trips.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {trips.map((t) => {
                const used = budgetUtilisation(t.budget);
                const over = t.budget.estimatedTotal > t.budget.totalBudget;
                return (
                  <Link key={t.id} href={`/trips/${t.id}`} className="rounded-2xl border border-line bg-white p-4 transition hover:shadow-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-ink">{t.title}</p>
                        <p className="text-2xs text-ink-faint">{fmtDate(t.startDate, { day: 'numeric', month: 'short', year: 'numeric' })} · {t.brief.days} days</p>
                      </div>
                      <span className={cn('rounded-full px-2 py-0.5 text-2xs font-medium', over ? 'bg-clay-50 text-clay-700' : 'bg-pine-50 text-pine-600')}>
                        {over ? 'Over' : 'On track'}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-2xl leading-none text-ink">{inr(t.budget.estimatedTotal, { compact: true })}</p>
                    <p className="mt-1 text-2xs text-ink-mute">{inr(t.budget.perPerson)} per person · budget {inr(t.budget.totalBudget, { compact: true })}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand">
                      <div className={cn('h-full rounded-full', over ? 'bg-clay-500' : 'bg-pine-600')} style={{ width: `${Math.min(100, used)}%` }} />
                    </div>
                    <p className="mt-2 inline-flex items-center gap-1 text-2xs font-medium text-clay-600">Open budget <ArrowRight size={10} /></p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
              <Wallet size={18} className="mx-auto text-ink-faint" />
              <p className="mt-2 font-display text-lg text-ink">No saved budgets yet</p>
              <p className="mt-1 text-xs text-ink-mute">Plan a trip and its budget will appear here.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl text-ink">Quick calculator</h2>
          <BudgetCalculator originCode={user.homeAirport} />
        </section>
      </div>
    </div>
  );
}
