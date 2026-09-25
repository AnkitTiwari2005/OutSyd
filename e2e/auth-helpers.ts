import { encode } from 'next-auth/jwt';
import type { BrowserContext } from '@playwright/test';

const AUTH_SECRET = process.env.AUTH_SECRET || 'outsyd-local-dev-auth-secret-key-32-chars-minimum';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role?: 'registered' | 'admin' | 'user';
}

export const TEST_ALICE: TestUser = {
  id: 'usr_alice_123',
  email: 'alice@outsyd.com',
  name: 'Alice Engineer',
  role: 'registered',
};

export const TEST_BOB: TestUser = {
  id: 'usr_bob_456',
  email: 'bob@outsyd.com',
  name: 'Bob Contractor',
  role: 'registered',
};

export const TEST_ADMIN: TestUser = {
  id: 'usr_admin_789',
  email: 'admin@outsyd.com',
  name: 'Admin Supervisor',
  role: 'admin',
};

export async function createSessionCookie(user: TestUser) {
  const token = {
    id: user.id,
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? 'registered',
  };

  const encoded = await encode({
    token,
    secret: AUTH_SECRET,
    salt: 'authjs.session-token',
  });

  return encoded;
}

export async function authenticateContext(context: BrowserContext, user: TestUser = TEST_ALICE) {
  const tokenValue = await createSessionCookie(user);

  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: tokenValue,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'authjs.session-token',
      value: tokenValue,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}
