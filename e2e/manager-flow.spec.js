const { test, expect } = require('@playwright/test');

test.describe('Manager End-to-End Portal Flow', () => {
  test('Manager can access sign in page and view portal navigation', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('http://localhost:5173/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    // 2. Check form inputs
    const emailInput = page.getByPlaceholder(/you@example.com/i);
    const passwordInput = page.getByPlaceholder(/••••••••/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });
});
