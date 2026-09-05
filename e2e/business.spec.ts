import { test, expect } from './fixtures';

test.describe('BOMs', () => {
  test('BOM list page loads with seeded BOMs', async ({ authenticatedPage: page }) => {
    await page.click('#tab-bom');
    await page.waitForURL(/.*#\/bom/, { timeout: 10000 });
    await expect(page.locator('text=Resep & Komposisi')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Resep Donat Coklat')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to create new BOM', async ({ authenticatedPage: page }) => {
    await page.click('#tab-bom');
    await page.waitForURL(/.*#\/bom/, { timeout: 10000 });
    const addBtn = page.locator('text=Buat Resep Baru').or(page.locator('text=Tambah Resep'));
    await addBtn.first().click();
    await page.waitForTimeout(1000);
  });
});

test.describe('Productions', () => {
  test('production list page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-production');
    await page.waitForURL(/.*#\/production/, { timeout: 10000 });
    await expect(page.locator('text=Aktivitas & Riwayat Produksi')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Sales', () => {
  test('sales list page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-sales');
    await page.waitForURL(/.*#\/sales/, { timeout: 10000 });
    await expect(page.locator('text=Riwayat Transaksi Penjualan')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Insights', () => {
  test('insights page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-insights');
    await page.waitForURL(/.*#\/insights/, { timeout: 10000 });
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings', () => {
  test('settings page loads with business info', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await page.waitForURL(/.*#\/settings/, { timeout: 10000 });
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Stock Opname', () => {
  test('stock opname page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-opname');
    await expect(page.locator('text=Stok Opname (Penyesuaian Fisik)')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Movements', () => {
  test('movements page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 15000 });
  });
});
