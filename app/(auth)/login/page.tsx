'use client';
import Image from 'next/image';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const redirect = searchParams?.get('redirect');
  const safeTarget = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password credentials.');
      return;
    }
    router.push(safeTarget);
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
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Account Sign In</h1>
          <p className="mt-1 text-xs text-[#64748B]">Access your saved construction estimates and projects</p>
        </div>

        <form onSubmit={handleSubmit} className="card-standard p-6 space-y-4 bg-white border border-[#E2E8F0]">
          {error && (
            <div className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#0F172A]">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="form-input pl-8"
                placeholder="architect@firm.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#0F172A]">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-[#1E3A5F] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="form-input pl-8"
                placeholder="••••••••"
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
                <Loader2 size={14} className="animate-spin" /> Signing in…
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[#64748B]">
          Don&apos;t have an account?{' '}
          <Link href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'} className="text-[#1E3A5F] font-semibold hover:underline">
            Register free
          </Link>
        </p>

        <p className="mt-2 text-center">
          <Link href="/estimate" className="inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1E3A5F]">
            <ArrowLeft size={12} /> Estimate without signing in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1E3A5F]" size={24} />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
