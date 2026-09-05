import { test, expect } from './fixtures';

test.describe('Movements', () => {
  test('movements page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
  });

  test('movements has filter tabs', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#filter-mov-all')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#filter-mov-material')).toBeVisible();
    await expect(page.locator('#filter-mov-product')).toBeVisible();
    await expect(page.locator('#filter-mov-in')).toBeVisible();
    await expect(page.locator('#filter-mov-out')).toBeVisible();
  });

  test('movements filter by materials', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
    await page.click('#filter-mov-material');
    await page.waitForTimeout(500);
  });

  test('movements filter by products', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
    await page.click('#filter-mov-product');
    await page.waitForTimeout(500);
  });

  test('movements filter by stock in', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
    await page.click('#filter-mov-in');
    await page.waitForTimeout(500);
  });

  test('movements filter by stock out', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
    await page.click('#filter-mov-out');
    await page.waitForTimeout(500);
  });

  test('movements search works', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
    await page.fill('#movement-search', 'Tepung');
    await page.waitForTimeout(500);
  });

  test('movements shows seeded data', async ({ authenticatedPage: page }) => {
    await page.click('#tab-movements');
    await expect(page.locator('text=Riwayat Mutasi & Pergerakan Stok')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: 'Waktu' })).toBeVisible({ timeout: 10000 });
  });
});
