import { test, expect } from './fixtures';

test.describe('Products CRUD', () => {
  test('products page shows seeded products', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await expect(page.locator('text=Stok Produk Jadi')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Donat Coklat')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Roti Manis Keju')).toBeVisible();
  });

  test('search products', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await expect(page.locator('text=Stok Produk Jadi')).toBeVisible({ timeout: 10000 });
    await page.fill('#prod-search-input', 'Donat');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Donat Coklat')).toBeVisible({ timeout: 10000 });
  });

  test('add new product via modal', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await expect(page.locator('text=Stok Produk Jadi')).toBeVisible({ timeout: 10000 });
    await page.click('#prod-btn-add');
    await expect(page.locator('text=Tambah Produk Jadi Baru')).toBeVisible({ timeout: 5000 });
    await page.fill('input[placeholder="Contoh: Donat Meses Coklat"]', 'Produk E2E');
    await page.selectOption('select', { label: 'pcs (Satuan)' });
    await page.fill('input[type="number"]:first-of-type', '7500');
    await page.click('button:has-text("Simpan Produk")');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('cell', { name: /Produk E2E/ })).toBeVisible({ timeout: 10000 });
  });

  test('navigate to production create from products', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await expect(page.locator('text=Stok Produk Jadi')).toBeVisible({ timeout: 10000 });
    await page.click('#prod-btn-goto-production');
    await expect(page.locator('text=Pilih Produk & Rencana Target')).toBeVisible({ timeout: 10000 });
  });

  test('product outgoing (non-sale) via modal', async ({ authenticatedPage: page }) => {
    await page.click('#tab-products');
    await expect(page.locator('text=Stok Produk Jadi')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Donat Coklat')).toBeVisible({ timeout: 10000 });

    const outBtn = page.locator('[id^="prod-btn-out-"]').first();
    await outBtn.click();
    await expect(page.locator('text=Catat Produk Keluar')).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="number"]', '1');
    await page.click('button:has-text("Lanjutkan Konfirmasi")');
    await expect(page.locator('#modal-confirm-btn')).toBeVisible({ timeout: 5000 });
    await page.click('#modal-confirm-btn');
    await page.waitForTimeout(2000);
  });
});
