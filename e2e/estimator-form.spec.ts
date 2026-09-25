import { test, expect } from '@playwright/test';
import { setupEstimateApiRoutes, fillStep1Canonical } from './test-helpers';

test.describe('E2E: Estimator Form & Calculation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupEstimateApiRoutes(page);
  });

  test('Continue button starts disabled and enables only when Tier 1 inputs are valid', async ({ page }) => {
    await page.goto('/estimate');

    // 1. Verify Continue button is initially disabled
    const continueBtn = page.locator('button[type="submit"]:has-text("Continue")');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toBeDisabled();

    // 2. Partial input: Fill only Length (50 ft) -> Continue must remain disabled
    await page.locator('input[placeholder="e.g. 50"]').fill('50');
    await expect(continueBtn).toBeDisabled();

    // 3. Fill Breadth (40 ft), Height (30 ft) -> Still disabled because floors, plot area, use, and location are missing
    await page.locator('input[placeholder="e.g. 30"]').fill('40');
    await page.locator('input[placeholder="e.g. 35"]').fill('30');
    await expect(continueBtn).toBeDisabled();

    // 4. Fill Plot Area (5000 sqft), Floors (3)
    await page.locator('input[placeholder="e.g. 2400"]').fill('5000');
    await page.locator('input[placeholder="e.g. 3"]').fill('3');
    await expect(continueBtn).toBeDisabled();

    // 5. Select Typology (Residential) and Building Use: 3BHK
    await page.locator('#typology-card-Residential').click();
    const buildingUseSelect = page.locator('select');
    await buildingUseSelect.selectOption({ label: '3BHK' });
    await expect(continueBtn).toBeDisabled();

    // 6. Select Soil Condition (Normal / Firm)
    await page.locator('button:has-text("Normal / Firm")').click();
    await expect(continueBtn).toBeDisabled();

    // 7. Fill Location: Ludhiana
    const locationInput = page.locator('input[placeholder*="Bengaluru"]');
    await locationInput.fill('Ludhiana');
    await expect(continueBtn).toBeDisabled();

    // 8. Select Quality Tier: Standard
    await page.locator('#quality-card-Standard').click();

    // 9. Verify Continue button is now enabled
    await expect(continueBtn).toBeEnabled();
  });

  test('Multi-step progression: Step 1 -> Step 2 -> Review -> Calculate Estimate', async ({ page }) => {
    await page.goto('/estimate');

    // Fill all canonical Step 1 inputs
    await fillStep1Canonical(page);

    const continueBtn = page.locator('button[type="submit"]:has-text("Continue")');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Step 2: Building & Structural System
    await expect(page.getByRole('heading', { name: /Step 2 of 3/i })).toBeVisible();
    await expect(page.locator('text=Structural Frame System')).toBeVisible();

    // Click Continue to advance to Step 3 (Review & Confirm)
    const step2ContinueBtn = page.locator('button[type="submit"]:has-text("Continue")');
    await expect(step2ContinueBtn).toBeEnabled();
    await step2ContinueBtn.click();

    // Step 3: Review & Confirm
    await expect(page.getByRole('heading', { name: /Step 3 of 3/i })).toBeVisible();
    const calculateBtn = page.locator('button[type="submit"]:has-text("Calculate Estimate")');
    await expect(calculateBtn).toBeVisible();
    await expect(calculateBtn).toBeEnabled();

    // Click Calculate Estimate
    await calculateBtn.click();

    // Assert navigation to results page
    await page.waitForURL('**/estimate/result');
    await expect(page).toHaveURL(/\/estimate\/result/);

    // Verify key components on Result page
    await expect(page.locator('text=Total Turnkey Cost')).toBeVisible();
    await expect(page.locator('text=Material Cost').first()).toBeVisible();
    await expect(page.locator('text=All-in / sqft')).toBeVisible();
    await expect(page.locator('text=Cost Distribution by Category')).toBeVisible();
  });
});
