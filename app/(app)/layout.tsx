import { getCurrentUser } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { ensureDemoUser } from '@/lib/db/store';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Seed the demo account on first boot so the product is explorable immediately.
  await ensureDemoUser();
  const user = await getCurrentUser();
  return <AppShell user={user}>{children}</AppShell>;
}
