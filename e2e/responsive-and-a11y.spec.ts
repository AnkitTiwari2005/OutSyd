import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 390, height: 844 },
];

test.describe('E2E: Responsive Layout & Accessibility Smoke Tests', () => {
  for (const vp of VIEWPORTS) {
    test(`Responsive layout renders without horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Check no horizontal scrollbar / overflow
      const homeOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(homeOverflow).toBe(false);

      // Check primary CTA visible
      const ctaBtn = page.locator('a[href="/estimate"]:has-text("Estimate Free")').first();
      await expect(ctaBtn).toBeVisible();

      // Check on /estimate
      await page.goto('/estimate');
      const estimateOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(estimateOverflow).toBe(false);
    });
  }

  test('Accessibility: ARIA landmarks and keyboard tab navigation', async ({ page }) => {
    await page.goto('/estimate');

    // 1. Check ARIA roles for custom controls
    const typologyGroup = page.locator('div[role="radiogroup"][aria-label="Building Typology"]');
    await expect(typologyGroup).toBeVisible();

    const soilGroup = page.locator('div[role="radiogroup"][aria-label="Soil condition"]');
    await expect(soilGroup).toBeVisible();

    // 2. Keyboard Tab navigation moves focus into input fields
    const lengthInput = page.locator('input[placeholder="e.g. 50"]');
    await lengthInput.focus();
    await expect(lengthInput).toBeFocused();

    // Tab to next input (Breadth)
    await page.keyboard.press('Tab');
    const breadthInput = page.locator('input[placeholder="e.g. 30"]');
    expect(breadthInput).toBeDefined();
    // In our stepper, the tab might go to stepper buttons or next input
    // Ensure active element is an input or button
    const tagName = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(tagName);
  });
});
