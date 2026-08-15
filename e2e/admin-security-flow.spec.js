const { test, expect } = require('@playwright/test');

test.describe('Admin & Security Moderation Flow', () => {
  test('Admin navigation and security controls', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
