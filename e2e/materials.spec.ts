import { test, expect } from './fixtures';

test.describe('Materials CRUD', () => {
  test('materials page shows seeded materials', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tepung Terigu')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Gula Pasir')).toBeVisible();
  });

  test('search materials', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await page.fill('#mat-search-input', 'Tepung');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Tepung Terigu')).toBeVisible({ timeout: 10000 });
  });

  test('add new material via modal', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await page.click('#mat-btn-add');
    await expect(page.locator('text=Tambah Bahan Baku Baru')).toBeVisible({ timeout: 5000 });
    await page.fill('input[placeholder="Contoh: Tepung Terigu Segitiga"]', 'Material E2E');
    await page.selectOption('select', { label: 'kg (Kilogram)' });
    await page.click('button:has-text("Simpan Material")');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('cell', { name: /Material E2E/ })).toBeVisible({ timeout: 10000 });
  });

  test('stock IN movement on material', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tepung Terigu')).toBeVisible({ timeout: 10000 });

    const inBtn = page.locator('[id^="mat-btn-in-"]').first();
    await inBtn.click();
    await expect(page.locator('text=Catat Stok Masuk')).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="number"]', '10');
    await page.fill('input[placeholder*="Belanja"]', 'Pembelian E2E');
    await page.click('button:has-text("Lanjutkan Konfirmasi")');
    await expect(page.locator('#modal-confirm-btn')).toBeVisible({ timeout: 5000 });
    await page.click('#modal-confirm-btn');
    await page.waitForTimeout(2000);
  });

  test('navigate to stock opname from materials', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await page.click('#mat-btn-opname');
    await expect(page.locator('text=Stok Opname (Penyesuaian Fisik)')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to movements from materials', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await page.click('#mat-btn-history');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
  });
});
