import { cn } from '@/lib/utils';

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
      <path
        d="M9 21.5c3.2-1.1 6.1-4 8-8.2 1.9 4.2 4.8 7.1 8 8.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="12" r="2.1" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-ink', className)}>
      <LogoMark size={compact ? 22 : 26} className="text-clay-500" />
      <span className={cn('font-display tracking-[-0.015em]', compact ? 'text-lg' : 'text-[22px]')}>
        Wayfarer<span className="text-clay-500">.</span>
      </span>
    </span>
  );
}
