'use client';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);

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

      setSubmitted(true);
    } catch {
      setError('A network error occurred. Please check your connection and try again.');
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
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Reset Password</h1>
          <p className="mt-1 text-xs text-[#64748B]">
            Enter your email to receive a secure password reset link
          </p>
        </div>

        <div className="card-standard p-6 bg-white border border-[#E2E8F0]">
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A5F]">Check your inbox</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  If an account exists for <span className="font-semibold text-[#0F172A]">{email}</span>, we have sent instructions to reset your password.
                </p>
              </div>
              <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#64748B] text-left">
                <strong>Note:</strong> Check your spam folder if the email does not arrive within a few minutes. Reset links remain valid for 60 minutes.
              </div>
              <Link
                href="/login"
                className="btn-primary w-full py-2.5 inline-flex items-center justify-center text-xs"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0F172A]">Account Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
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
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1E3A5F]">
            <ArrowLeft size={12} /> Back to Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
