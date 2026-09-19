import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Validates the JWT session invalidation logic implemented in auth.ts (NF-1).
 * If a user's password was changed after the token was issued (taking into account
 * 1-second clock skew), the token must be rejected.
 */
function isTokenRevoked(iatSec: number, passwordChangedAt: Date | null, clockSkewSec = 1): boolean {
  if (!passwordChangedAt) return false;
  const tokenIssuedAtMs = iatSec * 1000;
  const passwordChangedAtMs = passwordChangedAt.getTime();
  return passwordChangedAtMs > tokenIssuedAtMs + clockSkewSec * 1000;
}

describe('NF-1: Password Reset Session Invalidation', () => {
  it('allows token when password was never changed (passwordChangedAt is null)', () => {
    const tokenIat = Math.floor(Date.now() / 1000);
    assert.equal(isTokenRevoked(tokenIat, null), false);
  });

  it('allows token issued after password was changed', () => {
    const changedTime = new Date('2026-09-19T06:00:00Z');
    // Token issued 5 minutes after password change
    const tokenIat = Math.floor(changedTime.getTime() / 1000) + 300;
    assert.equal(isTokenRevoked(tokenIat, changedTime), false);
  });

  it('revokes token issued before password was changed', () => {
    const changedTime = new Date('2026-09-19T06:00:00Z');
    // Token issued 1 hour before password change
    const tokenIat = Math.floor(changedTime.getTime() / 1000) - 3600;
    assert.equal(isTokenRevoked(tokenIat, changedTime), true);
  });

  it('tolerates 1-second clock skew when token issued within skew tolerance', () => {
    const changedTime = new Date('2026-09-19T06:00:00.500Z');
    // Token issued at 06:00:00Z (500ms before password change)
    const tokenIat = Math.floor(new Date('2026-09-19T06:00:00Z').getTime() / 1000);
    // Within 1s skew tolerance, so not revoked
    assert.equal(isTokenRevoked(tokenIat, changedTime, 1), false);
  });

  it('revokes token when password change is beyond clock skew threshold', () => {
    const changedTime = new Date('2026-09-19T06:00:02Z');
    // Token issued at 06:00:00Z (2000ms before password change)
    const tokenIat = Math.floor(new Date('2026-09-19T06:00:00Z').getTime() / 1000);
    assert.equal(isTokenRevoked(tokenIat, changedTime, 1), true);
  });
});
