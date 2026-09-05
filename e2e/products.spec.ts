import { test, expect } from './fixtures';

test.describe('Products CRUD', () => {
  test('products page shows seeded products', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await page.waitForURL(/.*#\/inventory\/products/, { timeout: 10000 });
    await expect(page.locator('text=Stok Produk Jadi')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Donat Coklat')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Roti Manis Keju')).toBeVisible({ timeout: 5000 });
  });

  test('search products', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await page.waitForURL(/.*#\/inventory\/products/, { timeout: 10000 });
    await page.waitForSelector('#prod-search-input', { timeout: 10000 });
    await page.fill('#prod-search-input', 'Donat');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Donat Coklat')).toBeVisible({ timeout: 10000 });
  });

  test('add new product via modal', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await page.waitForURL(/.*#\/inventory\/products/, { timeout: 10000 });
    await page.click('#prod-btn-add');
    await expect(page.locator('text=Tambah Produk Jadi Baru')).toBeVisible({ timeout: 5000 });
    await page.fill('input[placeholder="Contoh: Donat Meses Coklat"]', 'Produk E2E');
    await page.selectOption('select', { label: 'pcs (Satuan)' });
    await page.fill('input[type="number"]:first-of-type', '7500');
    await page.click('button:has-text("Simpan Produk")');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('cell', { name: /Produk E2E/ })).toBeVisible({ timeout: 10000 });
  });
});
