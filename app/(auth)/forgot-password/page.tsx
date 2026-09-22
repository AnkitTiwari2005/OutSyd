'use client';
import { Logo } from '@/components/Logo';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit password reset request.');
        setLoading(false);
        return;
      }

      if (data.resetUrl) {
        setResetLink(data.resetUrl);
      }
      setSubmitted(true);
    } catch {
      setError('A network error occurred. Please check your connection and try again.');
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
          <h1 className="text-2xl font-bold text-[var(--accent-navy)]">Reset Password</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Enter your email to receive a secure password reset link
          </p>
        </div>

        <div className="card-standard p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-[var(--success-bg)] text-[var(--success-text)] rounded-full flex items-center justify-center mx-auto border border-[var(--success-border)]">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--accent-navy)]">Password Reset Ready</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  Reset instructions prepared for <span className="font-semibold text-[var(--text-primary)]">{email}</span>.
                </p>
              </div>

              {resetLink ? (
                <div className="p-3.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-muted)] text-left space-y-2.5">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Secure Reset Link:
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Click the button below to immediately set a new password for your account:
                  </p>
                  <Link
                    href={resetLink}
                    className="btn-primary w-full py-2.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <span>Proceed to Set New Password</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] text-left">
                  <strong>Note:</strong> Check your inbox and spam folder. Reset links remain valid for 60 minutes.
                </div>
              )}

              <Link
                href="/login"
                className="btn-secondary w-full py-2.5 inline-flex items-center justify-center text-xs"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-[var(--error-bg)] border border-[var(--error-border)] text-xs text-[var(--error-text)] font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Account Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="form-input pl-8"
                    placeholder="architect@firm.com"
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
                    <Loader2 size={14} className="animate-spin" /> Sending link…
                  </span>
                ) : (
                  'Send Reset Link'
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
