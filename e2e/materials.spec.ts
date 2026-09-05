import { test, expect } from './fixtures';

test.describe('Materials CRUD', () => {
  test('materials page shows seeded materials', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await page.waitForURL(/.*#\/inventory\/materials/, { timeout: 10000 });
    await expect(page.locator('text=Stok Bahan Baku & Material')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tepung Terigu')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Gula Pasir')).toBeVisible();
  });

  test('search materials', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await page.waitForURL(/.*#\/inventory\/materials/, { timeout: 10000 });
    await page.waitForSelector('#mat-search-input', { timeout: 10000 });
    await page.fill('#mat-search-input', 'Tepung');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Tepung Terigu')).toBeVisible({ timeout: 10000 });
  });

  test('add new material via modal', async ({ authenticatedPage: page }) => {
    await page.click('#tab-materials');
    await page.waitForURL(/.*#\/inventory\/materials/, { timeout: 10000 });
    await page.click('#mat-btn-add');
    await expect(page.locator('text=Tambah Bahan Baku Baru')).toBeVisible({ timeout: 5000 });
    await page.fill('input[placeholder="Contoh: Tepung Terigu Segitiga"]', 'Material E2E');
    await page.selectOption('select', { label: 'kg (Kilogram)' });
    await page.click('button:has-text("Simpan Material")');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('cell', { name: /Material E2E/ })).toBeVisible({ timeout: 10000 });
  });
});
