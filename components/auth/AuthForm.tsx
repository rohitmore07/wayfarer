'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'form' | 'demo' | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading('form');
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      router.push('/trips');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const demo = async () => {
    setLoading('demo');
    setError(null);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (!res.ok) throw new Error('Demo sign-in is unavailable');
      router.push('/trips');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="font-display text-[34px] leading-tight text-ink">
        {mode === 'login' ? 'Welcome back.' : 'Start planning.'}
      </h1>
      <p className="mt-2 text-sm text-ink-mute">
        {mode === 'login'
          ? 'Pick up where your last trip left off.'
          : 'Create an account to save trips, budgets and conversations.'}
      </p>

      <form onSubmit={submit} className="mt-7 space-y-3.5">
        {mode === 'signup' ? (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-soft">Full name</span>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Mehta"
              autoComplete="name"
              required
            />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Email</span>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-soft">Password</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-clay-200 bg-clay-50 px-3 py-2.5 text-xs text-clay-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn-primary w-full py-3" disabled={loading !== null}>
          {loading === 'form' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
          {mode === 'login' ? 'Sign in' : 'Create account'}
          <ArrowRight size={14} />
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-2xs uppercase tracking-[0.14em] text-ink-faint">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <button onClick={demo} className="btn-ghost w-full py-3" disabled={loading !== null}>
        {loading === 'demo' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
        Explore with the demo account
      </button>

      <p className="mt-6 text-center text-xs text-ink-mute">
        {mode === 'login' ? (
          <>
            New here?{' '}
            <Link href="/signup" className="font-medium text-clay-600 hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-clay-600 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
      <p className="mt-3 text-center text-2xs text-ink-faint">
        Demo credentials: demo@wayfarer.ai · demo1234
      </p>
    </div>
  );
}
