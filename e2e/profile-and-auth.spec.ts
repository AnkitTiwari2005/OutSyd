import { test, expect } from '@playwright/test';
import { authenticateContext, TEST_ALICE } from './auth-helpers';

test.describe('E2E: Profile Dropdown, Sign Out & Route Protection', () => {
  test('Profile dropdown opens, displays user details, and closes on outside click and Escape', async ({ context, page }) => {
    await authenticateContext(context, TEST_ALICE);
    await page.goto('/');

    // 1. Locate profile button with user initial 'A'
    const profileBtn = page.locator('button[aria-label="User profile menu"]');
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn.getByText('A', { exact: true })).toBeVisible();

    // 2. Open Profile Dropdown
    await profileBtn.click();
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();

    // 3. Verify user name, email, and menu options
    await expect(menu.locator('text=Alice Engineer')).toBeVisible();
    await expect(menu.locator('text=alice@outsyd.com')).toBeVisible();
    await expect(menu.locator('text=Dashboard & Projects')).toBeVisible();
    await expect(menu.locator('text=New Calculation')).toBeVisible();

    // 4. Test click outside dismisses the dropdown
    await page.mouse.click(10, 10);
    await expect(menu).not.toBeVisible();

    // 5. Test Escape key dismisses the dropdown
    await profileBtn.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
  });

  test('Sign Out flow clears session and verifies route protection on /dashboard', async ({ context, page }) => {
    await authenticateContext(context, TEST_ALICE);
    await page.goto('/');

    const profileBtn = page.locator('button[aria-label="User profile menu"]');
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    const signOutBtn = page.locator('button:has-text("Sign out")');
    await expect(signOutBtn).toBeVisible();

    // Click Sign Out and check for loading indicator or redirection
    await signOutBtn.click();

    // Verify user is redirected to public page / or /login
    await page.waitForTimeout(1000);

    // Now try to visit protected route /dashboard as unauthenticated user
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
