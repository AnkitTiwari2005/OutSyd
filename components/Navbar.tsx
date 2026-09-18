'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X, Calculator, User } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#1E3A5F] hover:bg-[#F7F8FA] rounded-md transition-colors"
          >
            <User size={15} />
            Dashboard
          </Link>

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
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] bg-white px-4 py-4 space-y-2 shadow-sm animate-in slide-in-from-top-2">
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
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F7F8FA] rounded-md"
          >
            Saved Projects Dashboard
          </Link>
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F7F8FA] rounded-md"
          >
            Sign In / Register
          </Link>
        </div>
      )}
    </header>
  );
}
