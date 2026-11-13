'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  '7 days in Japan in March, ₹1.5L per person, culture & food',
  'Quiet beach trip in November under ₹60,000',
  'Europe in May for 10 days, art and food',
  'Rajasthan long weekend from Mumbai',
];

export function HeroPrompt() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const go = (text: string) => {
    const q = text.trim();
    router.push(q ? `/plan?q=${encodeURIComponent(q)}` : '/plan');
  };

  return (
    <div className="w-full max-w-[560px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        className={cn(
          'relative rounded-2xl border bg-white p-2 shadow-card transition-all duration-300',
          focused ? 'border-clay-300 shadow-lift ring-4 ring-clay-50' : 'border-line'
        )}
      >
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
          <span className="mb-2.5 ml-2 hidden text-clay-500 sm:block">
            <Sparkles size={17} />
          </span>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                go(value);
              }
            }}
            rows={3}
            placeholder="Tell me where you want to go — “Japan in March for 7 days, ₹1.5L per person, love food and photography”"
            className="max-h-32 min-h-[52px] w-full resize-none bg-transparent px-2 py-3 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            type="submit"
            className="group mb-1 mr-1 inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ink px-4 text-[13px] font-medium text-ivory transition hover:bg-clay-600"
          >
            Plan My Trip
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink transition hover:border-clay-200 hover:text-clay-700"
        >
          Explore Destinations
          <ArrowRight size={13} />
        </Link>
        <span className="hidden h-4 w-px bg-line sm:block" />
        {EXAMPLES.slice(0, 3).map((ex) => (
          <button
            key={ex}
            onClick={() => go(ex)}
            className="rounded-full border border-line bg-white/70 px-3 py-1.5 text-left text-xs text-ink-mute transition hover:border-clay-200 hover:bg-white hover:text-ink"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
