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

  const token = await getToken({
    req: request,
    secret,
    salt: request.cookies.get('__Secure-authjs.session-token')
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token',
  });

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
  ],
};
