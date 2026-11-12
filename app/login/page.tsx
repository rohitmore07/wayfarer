import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthForm } from '@/components/auth/AuthForm';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata = { title: 'Sign in — Wayfarer' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/trips');
  return (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
