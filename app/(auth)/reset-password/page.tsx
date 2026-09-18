'use client';
import Image from 'next/image';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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
      <main className="min-h-screen bg-[#F7F8FA] text-[#0F172A] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/outsyd-logo.png"
                alt="OUTSYD"
                width={120}
                height={30}
                className="h-7 w-auto mx-auto"
                priority
              />
            </Link>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Invalid Reset Link</h1>
          </div>
          <div className="card-standard p-6 bg-white border border-[#E2E8F0] text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle size={24} />
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
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
    <main className="min-h-screen bg-[#F7F8FA] text-[#0F172A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/outsyd-logo.png"
              alt="OUTSYD"
              width={120}
              height={30}
              className="h-7 w-auto mx-auto"
              priority
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Set New Password</h1>
          <p className="mt-1 text-xs text-[#64748B]">
            Create a secure password for <span className="font-semibold text-[#0F172A]">{email}</span>
          </p>
        </div>

        <div className="card-standard p-6 bg-white border border-[#E2E8F0]">
          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A5F]">Password Reset Complete</h3>
                <p className="text-xs text-[#64748B] mt-1">
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
                <div className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="password"
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
                <label className="text-xs font-semibold text-[#0F172A]">Confirm New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="password"
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
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1E3A5F]">
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
      <main className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1E3A5F]" size={24} />
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
