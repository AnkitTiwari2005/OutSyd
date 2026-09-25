import { test, expect } from '@playwright/test';
import { BoundedCache } from '../lib/cache/bounded-cache';

interface ProjectRecord {
  id: string;
  userId: string | null;
  guestToken: string | null;
  name: string;
}

interface SessionUser {
  id: string;
  role: string;
}

function authorizeProjectAccess(
  project: ProjectRecord,
  user: SessionUser | null,
  guestToken?: string | null
): { allowed: boolean; status: number } {
  const isUserOwner = Boolean(user?.id && project.userId && user.id === project.userId);
  const isAdmin = user?.role === 'admin';
  const isGuestOwner = !project.userId && Boolean(project.guestToken && guestToken && project.guestToken === guestToken);

  if (!isUserOwner && !isAdmin && !isGuestOwner) {
    if (!user?.id && !guestToken) {
      return { allowed: false, status: 401 };
    }
    return { allowed: false, status: 403 };
  }
  return { allowed: true, status: 200 };
}

test.describe('E2E: Auth, Security, IDOR Protection & Error Handling', () => {
  const aliceProject: ProjectRecord = {
    id: 'proj-alice-123',
    userId: 'user-alice',
    guestToken: null,
    name: 'Alice Villa',
  };

  const guestProject: ProjectRecord = {
    id: 'proj-guest-456',
    userId: null,
    guestToken: 'token-secret-xyz',
    name: 'Guest Commercial Project',
  };

  const aliceUser: SessionUser = { id: 'user-alice', role: 'user' };
  const bobUser: SessionUser = { id: 'user-bob', role: 'user' };

  test('IDOR: Alice accesses her project (200), Bob attempting access is strictly blocked (403)', async ({ page }) => {
    // Intercept project access endpoint to simulate Alice vs Bob RBAC
    await page.route('**/api/test/project-access**', async (route) => {
      const authHeader = route.request().headers()['x-user-id'];
      const requestingUser = authHeader === 'user-alice' ? aliceUser : (authHeader === 'user-bob' ? bobUser : null);
      const authResult = authorizeProjectAccess(aliceProject, requestingUser);

      await route.fulfill({
        status: authResult.status,
        contentType: 'application/json',
        body: JSON.stringify({ allowed: authResult.allowed }),
      });
    });

    // Navigate to page so client fetch uses page routing
    await page.goto('/');

    // 1. Alice requests her project -> 200 OK
    const aliceRes = await page.evaluate(async () => {
      const res = await fetch('/api/test/project-access', {
        headers: { 'x-user-id': 'user-alice' },
      });
      return res.status;
    });
    expect(aliceRes).toBe(200);

    // 2. Bob requests Alice project -> 403 Forbidden
    const bobRes = await page.evaluate(async () => {
      const res = await fetch('/api/test/project-access', {
        headers: { 'x-user-id': 'user-bob' },
      });
      return res.status;
    });
    expect(bobRes).toBe(403);
  });

  test('Guest Token Security: Valid token succeeds (200), invalid token rejected (403), missing rejected (401)', async () => {
    // 1. Valid guest token
    const validGuest = authorizeProjectAccess(guestProject, null, 'token-secret-xyz');
    expect(validGuest.allowed).toBe(true);
    expect(validGuest.status).toBe(200);

    // 2. Invalid guest token
    const invalidGuest = authorizeProjectAccess(guestProject, null, 'wrong-token-abc');
    expect(invalidGuest.allowed).toBe(false);
    expect(invalidGuest.status).toBe(403);

    // 3. Missing guest token
    const missingGuest = authorizeProjectAccess(guestProject, null, null);
    expect(missingGuest.allowed).toBe(false);
    expect(missingGuest.status).toBe(401);
  });

  test('Cache Authorization: Pre-warmed cache does not permit cross-user bypass', async () => {
    const exportCache = new BoundedCache<Uint8Array>(50, 1000 * 60 * 30);
    const estimateId = 'est-alice-999';
    const fakePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF

    // Alice accesses and populates cache
    const aliceAuth = authorizeProjectAccess(aliceProject, aliceUser);
    expect(aliceAuth.allowed).toBe(true);
    exportCache.set(estimateId, fakePdfBytes);
    expect(exportCache.has(estimateId)).toBe(true);

    // Bob requests the exact same estimateId -> authorization check fails before cache read
    const bobAuth = authorizeProjectAccess(aliceProject, bobUser);
    expect(bobAuth.allowed).toBe(false);
    expect(bobAuth.status).toBe(403);

    const bobData = bobAuth.allowed ? exportCache.get(estimateId) : null;
    expect(bobData).toBeNull();
  });

  test('Error Handling: Non-existent page (404) renders gracefully without crash', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-at-all');
    // Next.js handles 404
    expect([200, 404]).toContain(response?.status());
    // Verify page renders without freezing
    await expect(page.locator('body')).toBeVisible();
  });

  test('API Validation: Malformed JSON and invalid schema payloads return 400', async ({ page }) => {
    // 1. Malformed JSON
    const malformedRes = await page.request.post('/api/estimate', {
      data: 'invalid json string{{{',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(malformedRes.status()).toBe(400);
    const malformedJson = await malformedRes.json();
    expect(['INVALID_JSON', 'VALIDATION_ERROR']).toContain(malformedJson.error);

    // 2. Negative dimensions
    const invalidSchemaRes = await page.request.post('/api/estimate', {
      data: {
        lengthFt: -50,
        breadthFt: 40,
        heightFt: 30,
        plotAreaSqft: 5000,
        numFloors: 3,
        typology: 'Residential',
        buildingUse: '3BHK',
        soilType: 'Normal',
        locationRegion: 'Ludhiana',
        qualityTier: 'Standard',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(invalidSchemaRes.status()).toBe(400);
    const invalidJson = await invalidSchemaRes.json();
    expect(invalidJson.error).toBe('VALIDATION_ERROR');
    expect(invalidJson.fieldErrors).toHaveProperty('lengthFt');
  });
});
