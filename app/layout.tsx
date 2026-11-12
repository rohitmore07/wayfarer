import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wayfarer — AI travel planning agent',
  description:
    'Tell us where you want to go. Your AI travel agent handles flights, stays, a day-by-day itinerary and the budget to match.',
  keywords: ['AI travel planner', 'trip planner', 'flights', 'hotels', 'itinerary', 'India travel'],
};

export const viewport = {
  themeColor: '#FAF8F4',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
