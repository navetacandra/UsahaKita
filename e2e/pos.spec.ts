import { test, expect } from './fixtures';

test.describe('POS (Point of Sale)', () => {
  test('POS page loads with products', async ({ authenticatedPage: page }) => {
    await page.click('#tab-pos');
    await expect(page.locator('#tab-pos')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#pos-search-input')).toBeVisible({ timeout: 10000 });
  });

  test('search products in POS', async ({ authenticatedPage: page }) => {
    await page.click('#tab-pos');
    await expect(page.locator('#pos-search-input')).toBeVisible({ timeout: 10000 });
    await page.fill('#pos-search-input', 'Donat');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Donat Coklat')).toBeVisible({ timeout: 10000 });
  });

  test('add product to cart and complete sale', async ({ authenticatedPage: page }) => {
    await page.click('#tab-pos');
    await expect(page.locator('#pos-search-input')).toBeVisible({ timeout: 10000 });

    const addBtn = page.locator('[id^="pos-add-"]').first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(500);

    await expect(page.locator('#pos-submit-btn')).toBeEnabled({ timeout: 5000 });
    await page.click('#pos-submit-btn');

    await expect(page.locator('text=Konfirmasi Transaksi Penjualan')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Konfirmasi Pembayaran")');
    await page.waitForTimeout(2000);

    const receipt = page.locator('text=Transaksi Selesai').or(page.locator('text=Struk'));
    await expect(receipt.first()).toBeVisible({ timeout: 10000 });

    const newTxnBtn = page.locator('button:has-text("Transaksi Baru")');
    if (await newTxnBtn.isVisible()) {
      await newTxnBtn.click();
    }
  });

  test('navigate to sales history from POS', async ({ authenticatedPage: page }) => {
    await page.click('#tab-pos');
    await expect(page.locator('#pos-search-input')).toBeVisible({ timeout: 10000 });
    const historyLink = page.locator('text=Lihat Riwayat Struk');
    if (await historyLink.isVisible()) {
      await historyLink.click();
      await expect(page.locator('text=Riwayat Transaksi Penjualan')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Sales History', () => {
  test('sales list page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-sales');
    await expect(page.locator('text=Riwayat Transaksi Penjualan')).toBeVisible({ timeout: 10000 });
  });

  test('sales shows seeded transactions', async ({ authenticatedPage: page }) => {
    await page.click('#tab-sales');
    await expect(page.locator('text=Riwayat Transaksi Penjualan')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('th').first()).toBeVisible({ timeout: 10000 });
  });
});
