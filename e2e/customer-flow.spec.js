const { test, expect } = require('@playwright/test');

test.describe('Customer End-to-End Discovery & Booking Flow', () => {
  test('Customer can land on homepage, search hotels, view details, and navigate', async ({ page }) => {
    // 1. Visit Home Page
    await page.goto('http://localhost:5173/');
    await expect(page).toHaveTitle(/Nestly/i);

    // 2. Check Hero branding and primary Call to Action
    const heroHeading = page.getByRole('heading', { level: 1 });
    await expect(heroHeading).toBeVisible();

    // 3. Navigate to Explore Hotels Page
    await page.click('text=Explore Hotels');
    await expect(page).toHaveURL(/.*\/hotels/);

    // 4. Verify Hotel Search & Filter Inputs
    const searchInput = page.getByPlaceholder(/where are you going/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Goa');

    // 5. Select Hotel Card
    const hotelCard = page.locator('.group.bg-white').first();
    await expect(hotelCard).toBeVisible();
  });
});
