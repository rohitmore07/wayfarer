'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { ImageOffIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * next/image with a graceful degradation path.
 *
 * Remote photography (Wikimedia, Unsplash) can rate-limit or 404 without warning.
 * When that happens we show a warm placeholder instead of the browser's broken
 * image icon, so cards never look unfinished.
 */
export function SafeImage({ className, onError, alt, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-label={alt}
        role="img"
        className="absolute inset-0 grid place-items-center bg-gradient-to-br from-sand via-[#EFE9DD] to-[#E4DCCC]"
      >
        <ImageOffIcon size={20} className="text-ink-faint/60" />
      </span>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      className={cn(className)}
    />
  );
}
