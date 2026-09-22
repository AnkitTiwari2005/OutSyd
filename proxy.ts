// proxy.ts — Next.js 16 RBAC proxy (replaces deprecated middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.error('AUTH_SECRET is not configured in proxy');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Detect HTTPS from request protocol, forwarded header, or secure cookie presence
  const isSecure =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https' ||
    Boolean(request.cookies.get('__Secure-authjs.session-token'));

  const cookieName = (isSecure && request.cookies.get('__Secure-authjs.session-token'))
    ? '__Secure-authjs.session-token'
    : (request.cookies.get('authjs.session-token') ? 'authjs.session-token' : (isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token'));

  let token = await getToken({
    req: request,
    secret,
    secureCookie: isSecure,
    cookieName,
    salt: cookieName,
  });

  // Fallback: if not found, attempt alternate cookie name
  if (!token) {
    const fallbackCookie = cookieName === '__Secure-authjs.session-token' ? 'authjs.session-token' : '__Secure-authjs.session-token';
    if (request.cookies.get(fallbackCookie)) {
      token = await getToken({
        req: request,
        secret,
        secureCookie: fallbackCookie.startsWith('__Secure-'),
        cookieName: fallbackCookie,
        salt: fallbackCookie,
      });
    }
  }

  // If already authenticated and navigating to login/register, redirect to destination or dashboard
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage && token) {
    const target = request.nextUrl.searchParams.get('redirect');
    const safeTarget = target && target.startsWith('/') && !target.startsWith('//') ? target : '/dashboard';
    return NextResponse.redirect(new URL(safeTarget, request.url));
  }

  const isApiAdmin = pathname.startsWith('/api/admin');
  const isApiProjects = pathname.startsWith('/api/projects');
  const isAdmin = pathname.startsWith('/admin') || isApiAdmin;
  const isDashboard = pathname.startsWith('/dashboard') || isApiProjects;

  if (isAdmin) {
    if (!token) {
      if (isApiAdmin) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== 'admin') {
      if (isApiAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isDashboard) {
    if (!token) {
      if (isApiProjects) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/projects/:path*',
    '/login',
    '/register',
  ],
};
