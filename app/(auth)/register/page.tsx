'use client';
import { Logo } from '@/components/Logo';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { User, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

function RegisterForm() {
  const searchParams = useSearchParams();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams?.get('redirect');
  const safeTarget = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(form),
      });

      let json: { error?: string } = {};
      try {
        json = await res.json() as { error?: string };
      } catch {
        json = { error: `Server error (${res.status})` };
      }

      if (!res.ok) {
        setError(json.error ?? 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // Automatically sign in the registered user
      const signInRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        window.location.href = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
        return;
      }

      // Hard navigate to synchronize cookies and refresh server components immediately
      window.location.href = safeTarget;
    } catch (err) {
      console.error('Registration fetch error:', err);
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-4">
            <Logo width={120} height={30} className="h-7 w-auto mx-auto" priority />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--accent-navy)]">Create Account</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Save custom building estimates and export reports</p>
        </div>

        <form onSubmit={handleSubmit} className="card-standard p-6 space-y-4 bg-[var(--bg-card)] border border-[var(--border-color)]">
          {error && (
            <div className="p-3 rounded-md bg-[var(--error-bg)] border border-[var(--error-border)] text-xs text-[var(--error-text)] font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                required
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="form-input pl-8"
                placeholder="Ankit Kumar Tiwari"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                required
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="form-input pl-8"
                placeholder="architect@firm.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-primary)]">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                required
                minLength={8}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="form-input pl-8"
                placeholder="8+ characters"
              />
            </div>
          </div>

          {/* Reserved single primary CTA per screen */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          Already registered?{' '}
          <Link href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'} className="text-[var(--accent-navy)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-2 text-center">
          <Link href="/estimate" className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-navy)]">
            <ArrowLeft size={12} /> Estimate without signing in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent-navy)]" size={24} />
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
