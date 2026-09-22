// lib/auth/config.ts — Edge-safe Auth.js v5 config (no DB imports here)
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
    error : '/auth/error',
  },
  providers: [], // credentials provider added in auth.ts (non-edge)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = (user as { role?: string }).role ?? 'registered';
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        const userId = (token.id || token.sub) as string;
        if (session.user) {
          session.user.id = userId;
          session.user.role = (token.role as string) || 'registered';
        }
      }
      return session;
    },
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
};
