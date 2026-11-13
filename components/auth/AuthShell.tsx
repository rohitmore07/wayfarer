import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { unsplash, PHOTOS } from '@/lib/data/unsplash';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Wayfarer home">
            <Logo />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-mute hover:text-ink">
            <ArrowLeft size={13} /> Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">{children}</div>
        <p className="text-center text-2xs text-ink-faint">
          By continuing you agree that this is a demonstration product; no bookings are made.
        </p>
      </div>

      <div className="relative hidden lg:block">
        <Image src={unsplash(PHOTOS.kyoto, 1600)} alt="Kyoto street at dusk" fill className="object-cover" sizes="50vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <div className="absolute inset-x-10 bottom-12 text-ivory">
          <p className="text-2xs uppercase tracking-[0.16em] text-white/60">Now planning</p>
          <p className="mt-3 max-w-md font-display text-[30px] leading-tight">
            “Seven days in Japan, in March, with my partner — culture, food and photography.”
          </p>
          <p className="mt-4 text-xs text-white/60">
            → 9 flights compared · 6 stays shortlisted · 7 days routed · ₹1.42L per person
          </p>
        </div>
      </div>
    </div>
  );
}
