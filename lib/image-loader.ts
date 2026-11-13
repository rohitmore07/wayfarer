/**
 * Custom next/image loader.
 *
 * The app mixes two image sources: Unsplash (supports on-the-fly resizing) and
 * Wikimedia thumbnails (reject the Next.js optimiser's user agent, and only a
 * fixed set of thumbnail widths exist). Rather than run everything through
 * `/_next/image`, we hand each source its own best URL — Unsplash gets an exact
 * width, Wikimedia is passed through untouched.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.includes('images.unsplash.com')) {
    const [base] = src.split('?');
    return `${base}?auto=format&fit=crop&w=${width}&q=${quality ?? 80}`;
  }
  return src;
}
