import { test, expect } from '@playwright/test';

test('application loads and displays login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
});
