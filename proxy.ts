// proxy.ts — Next.js 16 RBAC proxy (replaces deprecated middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes requiring auth
  const authRequired = ['/dashboard', '/admin'];
  const adminOnly    = ['/admin'];

  const isProtected = authRequired.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Read session from cookie (edge-safe)
  const token = request.cookies.get('authjs.session-token')?.value
    ?? request.cookies.get('__Secure-authjs.session-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route — check role from session
  const isAdmin = adminOnly.some(p => pathname.startsWith(p));
  if (isAdmin) {
    // Decode JWT to check role (edge-safe — no DB call)
    // Role is embedded in token by Auth.js callbacks
    try {
      const base64   = token.split('.')[1];
      const decoded  = JSON.parse(Buffer.from(base64, 'base64url').toString());
      if (decoded?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
