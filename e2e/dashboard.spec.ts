import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test('dashboard loads with stats', async ({ authenticatedPage: page }) => {
    await expect(page.locator('text=Ringkasan Operasional Usaha')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Material').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Produk').first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard has recent activity', async ({ authenticatedPage: page }) => {
    await expect(page.locator('text=Stok').first()).toBeVisible({ timeout: 10000 });
  });
});
