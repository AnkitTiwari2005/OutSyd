import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encode, getToken } from 'next-auth/jwt';

interface MockRequest {
  headers: Headers;
  cookies: {
    get: (name: string) => { name: string; value: string } | undefined;
  };
  nextUrl: URL;
}

function asAuthReq(req: MockRequest): Parameters<typeof getToken>[0]['req'] {
  return req as unknown as Parameters<typeof getToken>[0]['req'];
}

describe('Auth & Proxy JWT Token Resolution', () => {
  const secret = 'super-secret-key-that-is-at-least-32-chars-long-12345';

  it('resolves session token under HTTP (localhost) using authjs.session-token', async () => {
    const payload = { id: 'usr_local_123', email: 'architect@outsyd.com', role: 'registered' };
    const encoded = await encode({
      token: payload,
      secret,
      salt: 'authjs.session-token',
    });

    const fakeRequest: MockRequest = {
      headers: new Headers({
        cookie: `authjs.session-token=${encoded}`,
      }),
      cookies: {
        get(name: string) {
          if (name === 'authjs.session-token') return { name, value: encoded };
          return undefined;
        },
      },
      nextUrl: new URL('http://localhost:3000/dashboard'),
    };

    const isSecure = fakeRequest.nextUrl.protocol === 'https:' ||
      fakeRequest.headers.get('x-forwarded-proto') === 'https' ||
      Boolean(fakeRequest.cookies.get('__Secure-authjs.session-token'));

    const cookieName = (isSecure && fakeRequest.cookies.get('__Secure-authjs.session-token'))
      ? '__Secure-authjs.session-token'
      : (fakeRequest.cookies.get('authjs.session-token') ? 'authjs.session-token' : 'authjs.session-token');

    const token = await getToken({
      req: asAuthReq(fakeRequest),
      secret,
      secureCookie: isSecure,
      cookieName,
      salt: cookieName,
    });

    assert.ok(token);
    assert.equal(token.id, 'usr_local_123');
    assert.equal(token.email, 'architect@outsyd.com');
    assert.equal(token.role, 'registered');
  });

  it('resolves session token under HTTPS (Vercel) using __Secure-authjs.session-token', async () => {
    const payload = { id: 'usr_prod_456', email: 'admin@outsyd.com', role: 'admin' };
    const encoded = await encode({
      token: payload,
      secret,
      salt: '__Secure-authjs.session-token',
    });

    const fakeRequest: MockRequest = {
      headers: new Headers({
        cookie: `__Secure-authjs.session-token=${encoded}`,
        'x-forwarded-proto': 'https',
      }),
      cookies: {
        get(name: string) {
          if (name === '__Secure-authjs.session-token') return { name, value: encoded };
          return undefined;
        },
      },
      nextUrl: new URL('https://outsyd-three.vercel.app/admin'),
    };

    const isSecure = fakeRequest.nextUrl.protocol === 'https:' ||
      fakeRequest.headers.get('x-forwarded-proto') === 'https' ||
      Boolean(fakeRequest.cookies.get('__Secure-authjs.session-token'));

    const cookieName = (isSecure && fakeRequest.cookies.get('__Secure-authjs.session-token'))
      ? '__Secure-authjs.session-token'
      : (fakeRequest.cookies.get('authjs.session-token') ? 'authjs.session-token' : '__Secure-authjs.session-token');

    const token = await getToken({
      req: asAuthReq(fakeRequest),
      secret,
      secureCookie: isSecure,
      cookieName,
      salt: cookieName,
    });

    assert.ok(token);
    assert.equal(token.id, 'usr_prod_456');
    assert.equal(token.email, 'admin@outsyd.com');
    assert.equal(token.role, 'admin');
  });

  it('returns null when no session token cookie is present', async () => {
    const fakeRequest: MockRequest = {
      headers: new Headers(),
      cookies: {
        get() {
          return undefined;
        },
      },
      nextUrl: new URL('https://outsyd-three.vercel.app/dashboard'),
    };

    const isSecure = fakeRequest.nextUrl.protocol === 'https:' ||
      fakeRequest.headers.get('x-forwarded-proto') === 'https' ||
      Boolean(fakeRequest.cookies.get('__Secure-authjs.session-token'));

    const cookieName = (isSecure && fakeRequest.cookies.get('__Secure-authjs.session-token'))
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';

    const token = await getToken({
      req: asAuthReq(fakeRequest),
      secret,
      secureCookie: isSecure,
      cookieName,
      salt: cookieName,
    });

    assert.equal(token, null);
  });
});
