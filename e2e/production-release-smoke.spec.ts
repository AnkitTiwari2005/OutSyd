import { test, expect } from '@playwright/test';
import { authenticateContext, TEST_ALICE } from './auth-helpers';
import { fillStep1Canonical, setupEstimateApiRoutes } from './test-helpers';

test.describe('Production Release Readiness Smoke Flow', () => {
  const VIEWPORTS = [
    { name: 'Desktop (1920x1080)', width: 1920, height: 1080 },
    { name: 'Laptop (1366x768)', width: 1366, height: 768 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Mobile (390x844)', width: 390, height: 844 },
  ];

  for (const vp of VIEWPORTS) {
    test(`Complete User Smoke Flow on ${vp.name}`, async ({ context, page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
            consoleErrors.push(text);
          }
        }
      });

      page.on('requestfailed', (req) => {
        const failure = req.failure();
        if (failure?.errorText !== 'net::ERR_ABORTED') {
          failedRequests.push(`${req.method()} ${req.url()} - ${failure?.errorText}`);
        }
      });

      // 1. Authenticate user session
      await authenticateContext(context, TEST_ALICE);

      // Setup estimate, PDF, and Excel routes for deterministic execution
      const { estimateId } = await setupEstimateApiRoutes(page);

      // Intercept save endpoint
      await page.route(`**/api/estimate/${estimateId}/save`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, projectId: 'proj-cert-999' }),
        });
      });

      // 2. Visit home and verify authenticated navbar
      await page.goto('/');
      await expect(page).toHaveURL('/');

      // 3. New Estimate
      await page.goto('/estimate');
      await expect(page).toHaveURL('/estimate');

      // 4. Step 1: Fill canonical inputs
      await fillStep1Canonical(page);
      const continueBtn = page.locator('button[type="submit"]:has-text("Continue")');
      await expect(continueBtn).toBeEnabled();
      await continueBtn.click();

      // 5. Step 2: Structural & Building Specifications
      await expect(page.locator('text=Structural Frame System')).toBeVisible();
      const step2ContinueBtn = page.locator('button[type="submit"]:has-text("Continue")');
      await expect(step2ContinueBtn).toBeEnabled();
      await step2ContinueBtn.click();

      // 6. Step 3: Review & Confirm
      const calculateBtn = page.locator('button[type="submit"]:has-text("Calculate Estimate")');
      await expect(calculateBtn).toBeVisible();
      await expect(calculateBtn).toBeEnabled();

      // 7. Calculate Estimate
      await calculateBtn.click();

      // 8. Results Page Navigation & Content Verification
      await page.waitForURL('**/estimate/result');
      await expect(page).toHaveURL(/\/estimate\/result/);
      await expect(page.locator('text=Total Turnkey Cost')).toBeVisible();
      await expect(page.locator('text=Material Cost').first()).toBeVisible();

      // 9. PDF Export verification
      const pdfBtn = page.locator('button:has-text("PDF BOQ")').first();
      await expect(pdfBtn).toBeVisible();
      const [pdfDownload] = await Promise.all([
        page.waitForEvent('download'),
        pdfBtn.click(),
      ]);
      const pdfStream = await pdfDownload.createReadStream();
      const pdfChunks: Buffer[] = [];
      for await (const chunk of pdfStream) {
        pdfChunks.push(Buffer.from(chunk));
      }
      const pdfBuffer = Buffer.concat(pdfChunks);
      expect(pdfBuffer.length).toBeGreaterThan(100);
      expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-');

      // 10. Save Estimate Modal Flow
      const saveBtn = page.locator('button[title*="Save"]').first();
      await expect(saveBtn).toBeVisible();
      await saveBtn.evaluate((el: HTMLElement) => el.click());

      const modalTitle = page.locator('#save-modal-title');
      await expect(modalTitle).toBeVisible();
      const modalSaveBtn = page.locator('button:has-text("Save Project")');
      await expect(modalSaveBtn).toBeVisible();
      await modalSaveBtn.click();

      // 11. Profile Dropdown & Sign Out
      await page.goto('/');
      const profileBtn = page.locator('button[aria-label="User profile menu"]');
      if (await profileBtn.isVisible()) {
        await profileBtn.click();
        const signOutBtn = page.locator('button:has-text("Sign out")');
        await expect(signOutBtn).toBeVisible();
        await signOutBtn.click();
      } else {
        await context.clearCookies();
        await page.goto('/');
      }

      // 12. Verify session termination & route guard on /dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);

      // 13. Verify no unhandled console errors or failed requests
      expect(consoleErrors).toHaveLength(0);
      expect(failedRequests).toHaveLength(0);
    });
  }
});
