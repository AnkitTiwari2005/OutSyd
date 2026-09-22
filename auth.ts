// auth.ts — Auth.js v5 with stateless JWT sessions
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { authConfig } from '@/lib/auth/config';
import { z } from 'zod';

const LoginSchema = z.object({
  email   : z.string().email(),
  password: z.string().min(6),
});

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  throw new Error('FATAL: AUTH_SECRET or NEXTAUTH_SECRET environment variable is missing.');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: authSecret,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = (user as { role?: string }).role ?? 'registered';
        return token;
      }

      // NF-1: Invalidate existing token if password was changed after token was issued
      const userId = (token.id || token.sub) as string | undefined;
      if (userId) {
        try {
          const [dbUser] = await db
            .select({ passwordChangedAt: users.passwordChangedAt })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (dbUser?.passwordChangedAt) {
            const tokenIssuedAtMs = ((token.iat as number) || 0) * 1000;
            const passwordChangedAtMs = dbUser.passwordChangedAt.getTime();
            // 1-second clock skew tolerance
            if (passwordChangedAtMs > tokenIssuedAtMs + 1000) {
              return null;
            }
          }
        } catch (err) {
          console.warn('[Auth:jwt] Failed to check passwordChangedAt:', err);
        }
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
});
