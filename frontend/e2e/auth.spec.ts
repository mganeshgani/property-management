import { test, expect } from '@playwright/test';

test('Login page loads and shows form', async ({ page }) => {
  // Navigate to the login page via the Next.js server we started
  await page.goto('/auth/login');
  
  // Wait for the form to be visible
  await expect(page.locator('form')).toBeVisible();
  
  // Verify that an email and password input exist
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
