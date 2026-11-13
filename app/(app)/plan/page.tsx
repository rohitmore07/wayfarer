import { PlannerWorkspace } from '@/components/agent/PlannerWorkspace';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'AI trip planner — Wayfarer' };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  return (
    <PlannerWorkspace
      initialQuery={q}
      user={user ? { name: user.name, avatarColor: user.avatarColor } : null}
    />
  );
}
