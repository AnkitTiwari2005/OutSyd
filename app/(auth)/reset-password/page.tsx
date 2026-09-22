'use client';
import { Logo } from '@/components/Logo';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [success, setSuccess]                 = useState(false);

  if (!token || !email) {
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
            <h1 className="text-2xl font-bold text-[var(--accent-navy)]">Invalid Reset Link</h1>
          </div>
          <div className="card-standard p-6 bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-4">
            <div className="w-12 h-12 bg-[var(--warning-bg)] text-[var(--warning-text)] rounded-full flex items-center justify-center mx-auto border border-[var(--warning-border)]">
              <AlertCircle size={24} />
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              This password reset link is missing a valid token or email address. Please request a new link.
            </p>
            <Link
              href="/forgot-password"
              className="btn-primary w-full py-2.5 inline-flex items-center justify-center text-xs"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-type your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('A network error occurred. Please try again.');
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
          <h1 className="text-2xl font-bold text-[var(--accent-navy)]">Set New Password</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Create a secure password for <span className="font-semibold text-[var(--text-primary)]">{email}</span>
          </p>
        </div>

        <div className="card-standard p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-[var(--success-bg)] text-[var(--success-text)] rounded-full flex items-center justify-center mx-auto border border-[var(--success-border)]">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--accent-navy)]">Password Reset Complete</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Your password has been successfully updated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="btn-primary w-full py-2.5 inline-flex items-center justify-center text-xs"
              >
                Sign In Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-[var(--error-bg)] border border-[var(--error-border)] text-xs text-[var(--error-text)] font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="form-input pl-8"
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Confirm New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="form-input pl-8"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Saving password…
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center">
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-navy)]">
            <ArrowLeft size={12} /> Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent-navy)]" size={24} />
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
