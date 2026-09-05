import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('authenticated user sees all nav tabs', async ({ authenticatedPage: page }) => {
    const navTabs = [
      '#tab-dashboard', '#tab-materials', '#tab-products', '#tab-movements',
      '#tab-opname', '#tab-bom', '#tab-production', '#tab-pos',
      '#tab-sales', '#tab-insights', '#tab-settings',
    ];
    for (const tab of navTabs) {
      await expect(page.locator(tab)).toBeVisible({ timeout: 5000 });
    }
  });

  test('navigate to materials page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to products page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await expect(page.locator('text=Stok Produk Jadi')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to BOM page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-bom');
    await expect(page.locator('text=Resep & Komposisi')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to production page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-production');
    await expect(page.locator('text=Aktivitas & Riwayat Produksi')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to sales page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-sales');
    await expect(page.locator('text=Riwayat Transaksi Penjualan')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to insights page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-insights');
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to settings page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to POS page via header', async ({ authenticatedPage: page }) => {
    await page.click('#header-quick-pos-btn');
    await expect(page.locator('#tab-pos')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to POS page via nav tab', async ({ authenticatedPage: page }) => {
    await page.click('#tab-pos');
    await expect(page.locator('#tab-pos')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to movements page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to stock opname page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-opname');
    await expect(page.locator('text=Stok Opname (Penyesuaian Fisik)')).toBeVisible({ timeout: 10000 });
  });

  test('brand logo navigates to dashboard', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await page.click('#brand-logo-btn');
    await expect(page.locator('text=Ringkasan Operasional Usaha')).toBeVisible({ timeout: 10000 });
  });

  test('header quick production button navigates', async ({ authenticatedPage: page }) => {
    await page.click('#header-quick-prod-btn');
    await expect(page.locator('text=Pilih Produk & Rencana Target')).toBeVisible({ timeout: 10000 });
  });

  test('header quick insight button navigates', async ({ authenticatedPage: page }) => {
    await page.click('#header-quick-insight-btn');
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
  });
});
