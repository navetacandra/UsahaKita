import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('authenticated user sees all nav tabs', async ({ authenticatedPage: page }) => {
    const tabs = [
      'Dashboard', 'Stok Bahan', 'Stok Produk', 'Mutasi Stok',
      'Stok Opname', 'Produksi', 'Penjualan', 'AI Insight', 'Pengaturan',
    ];
    for (const tab of tabs) {
      await expect(page.locator(`nav >> text=${tab}`)).toBeVisible({ timeout: 5000 });
    }
    await expect(page.locator('#tab-bom')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#tab-pos')).toBeVisible({ timeout: 5000 });
  });

  test('navigate to materials page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await page.waitForURL(/.*#\/inventory\/materials/, { timeout: 10000 });
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to products page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await page.waitForURL(/.*#\/inventory\/products/, { timeout: 10000 });
    await expect(page.locator('text=Stok Produk Jadi')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to BOM page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-bom');
    await page.waitForURL(/.*#\/bom/, { timeout: 10000 });
    await expect(page.locator('text=Resep & Komposisi')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to production page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-production');
    await page.waitForURL(/.*#\/production/, { timeout: 10000 });
    await expect(page.locator('text=Aktivitas & Riwayat Produksi')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to sales page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-sales');
    await page.waitForURL(/.*#\/sales/, { timeout: 10000 });
    await expect(page.locator('text=Riwayat Transaksi Penjualan')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to insights page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-insights');
    await page.waitForURL(/.*#\/insights/, { timeout: 10000 });
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to settings page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await page.waitForURL(/.*#\/settings/, { timeout: 10000 });
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to POS page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-pos');
    await page.waitForURL(/.*#\/pos/, { timeout: 10000 });
    await expect(page.locator('#tab-pos')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to movements page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await page.waitForURL(/.*#\/inventory\/movements/, { timeout: 10000 });
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to stock opname page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-opname');
    await page.waitForURL(/.*#\/inventory\/stock-opname/, { timeout: 10000 });
    await expect(page.locator('text=Stok Opname (Penyesuaian Fisik)')).toBeVisible({ timeout: 10000 });
  });
});
