import { test, expect } from './fixtures';

test.describe('Header', () => {
  test('header quick POS button works', async ({ authenticatedPage: page }) => {
    await page.click('#header-quick-pos-btn');
    await expect(page.locator('#tab-pos')).toBeVisible({ timeout: 10000 });
  });

  test('header quick production button works', async ({ authenticatedPage: page }) => {
    await page.click('#header-quick-prod-btn');
    await expect(page.locator('text=Pilih Produk & Rencana Target')).toBeVisible({ timeout: 10000 });
  });

  test('header quick insight button works', async ({ authenticatedPage: page }) => {
    await page.click('#header-quick-insight-btn');
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
  });

  test('header logout button works', async ({ authenticatedPage: page }) => {
    await page.click('#header-logout-btn');
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Masuk ke UsahaKita');
  });

  test('brand logo navigates to dashboard', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await page.click('#brand-logo-btn');
    await expect(page.locator('text=Ringkasan Operasional Usaha')).toBeVisible({ timeout: 10000 });
  });
});
