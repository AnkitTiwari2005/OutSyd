// auth.ts — Auth.js v5 with SQLite DrizzleAdapter
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
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
  secret: authSecret,
  adapter: DrizzleAdapter(db),
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
});
