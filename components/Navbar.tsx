'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowRight, Menu, X, Calculator, User, LogOut, Shield } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const isEstimate = pathname.startsWith('/estimate');

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/outsyd-logo.png"
              alt="OUTSYD"
              width={112}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/estimate"
              className={`flex items-center gap-1.5 transition-colors ${
                isEstimate ? 'text-[#1E3A5F] font-semibold' : 'text-[#64748B] hover:text-[#1E3A5F]'
              }`}
            >
              <Calculator size={15} />
              Estimator
            </Link>
            <Link
              href="/#categories"
              className="text-[#64748B] hover:text-[#1E3A5F] transition-colors"
            >
              18 Categories
            </Link>
            <Link
              href="/#how-it-works"
              className="text-[#64748B] hover:text-[#1E3A5F] transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="/#features"
              className="text-[#64748B] hover:text-[#1E3A5F] transition-colors"
            >
              Accuracy & Standards
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] hover:bg-[#EFF4FA] rounded-md transition-colors border border-[#CBD5E1]"
              >
                <User size={13} />
                <span className="max-w-[120px] truncate">{session.user.name || session.user.email}</span>
              </Link>

              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-md transition-colors"
                >
                  <Shield size={12} />
                  <span>Admin</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-md transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={13} />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] hover:bg-[#F7F8FA] rounded-md transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* Reserved single primary CTA per screen */}
          <Link
            href="/estimate"
            className="btn-primary"
          >
            <span>Estimate Free</span>
            <ArrowRight size={14} />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#64748B] hover:text-[#0F172A] rounded-md"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          role="navigation"
          aria-label="Mobile navigation"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMobileOpen(false);
          }}
          className="md:hidden border-b border-[#E2E8F0] bg-white px-4 py-4 space-y-2 shadow-sm animate-in slide-in-from-top-2"
        >
          <Link
            href="/estimate"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F7F8FA] rounded-md"
          >
            Estimator (18 Categories)
          </Link>
          <Link
            href="/#categories"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F7F8FA] rounded-md"
          >
            18 Construction Categories
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F7F8FA] rounded-md"
          >
            Methodology & Standards
          </Link>
          {session?.user ? (
            <>
              <div className="px-3 py-2 border-t border-b border-slate-100 my-1 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="text-sm font-semibold text-[#1E3A5F] truncate">{session.user.name || session.user.email}</p>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#1E3A5F] hover:bg-[#F7F8FA] rounded-md"
              >
                <User size={16} />
                Dashboard
              </Link>
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 rounded-md"
                >
                  <Shield size={16} />
                  Admin Console
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#B91C1C] hover:bg-[#FEF2F2] rounded-md transition-colors text-left cursor-pointer"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-[#1E3A5F] hover:bg-[#F7F8FA] rounded-md"
            >
              Sign In / Register
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
