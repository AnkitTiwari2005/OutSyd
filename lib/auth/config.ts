// lib/auth/config.ts — Edge-safe Auth.js v5 config (no DB imports here)
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error : '/auth/error',
  },
  providers: [], // credentials provider added in auth.ts (non-edge)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = (auth?.user as any)?.role as string | undefined;
      const path = nextUrl.pathname;

      if (path.startsWith('/admin'))               return role === 'admin';
      if (path.startsWith('/dashboard'))           return !!auth?.user;
      if (path.startsWith('/api/projects'))        return !!auth?.user;
      if (path.startsWith('/api/admin'))           return role === 'admin';
      return true; // public routes
    },
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id!;
        token.role = (user as any).role ?? 'registered';
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        (session.user as any).id   = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
};
