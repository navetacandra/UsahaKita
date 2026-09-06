import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test('dashboard loads with operational summary', async ({ authenticatedPage: page }) => {
    await expect(page.locator('text=Ringkasan Operasional Usaha')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows metric cards', async ({ authenticatedPage: page }) => {
    await expect(page.locator('text=Total Penjualan').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Output Produksi').first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard quick action buttons exist', async ({ authenticatedPage: page }) => {
    await expect(page.locator('#dash-quick-pos')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#dash-quick-production')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard quick action navigates to POS', async ({ authenticatedPage: page }) => {
    await page.click('#dash-quick-pos');
    await expect(page.locator('#tab-pos')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard quick action navigates to production create', async ({ authenticatedPage: page }) => {
    await page.click('#dash-quick-production');
    await expect(page.locator('text=Pilih Produk & Rencana Target')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard view all insights link', async ({ authenticatedPage: page }) => {
    const btn = page.locator('#dash-view-all-insights');
    const exists = await btn.count() > 0;
    test.skip(!exists, 'No insights available to show');
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows stock warnings section', async ({ authenticatedPage: page }) => {
    await expect(page.locator('text=Perlu Perhatian Stok').first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows recent activity section', async ({ authenticatedPage: page }) => {
    await expect(page.locator('text=Aktivitas Stok').first()).toBeVisible({ timeout: 10000 });
  });
});
