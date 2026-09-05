import { test, expect } from './fixtures';

test.describe('Stock Opname', () => {
  test('stock opname page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-opname');
    await expect(page.locator('text=Stok Opname (Penyesuaian Fisik)')).toBeVisible({ timeout: 10000 });
  });

  test('stock opname form elements exist', async ({ authenticatedPage: page }) => {
    await page.click('#tab-opname');
    await expect(page.locator('text=Stok Opname (Penyesuaian Fisik)')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#opname-select-mat')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#opname-select-prod')).toBeVisible();
    await expect(page.locator('#opname-item-dropdown')).toBeVisible();
    await expect(page.locator('#opname-actual-input')).toBeVisible();
    await expect(page.locator('#opname-submit-btn')).toBeVisible();
  });

  test('create stock opname for material', async ({ authenticatedPage: page }) => {
    await page.click('#tab-opname');
    await expect(page.locator('text=Stok Opname (Penyesuaian Fisik)')).toBeVisible({ timeout: 10000 });

    await page.click('#opname-select-mat');
    await page.waitForTimeout(500);

    await page.selectOption('#opname-item-dropdown', { index: 1 });
    await page.waitForTimeout(500);

    await page.fill('#opname-actual-input', '15');
    await page.fill('#opname-note-input', 'Opname E2E material');

    await page.click('#opname-submit-btn');

    await expect(page.locator('#modal-confirm-btn')).toBeVisible({ timeout: 5000 });
    await page.click('#modal-confirm-btn');
    await page.waitForTimeout(2000);
  });

  test('create stock opname for product', async ({ authenticatedPage: page }) => {
    await page.click('#tab-opname');
    await expect(page.locator('text=Stok Opname (Penyesuaian Fisik)')).toBeVisible({ timeout: 10000 });

    await page.click('#opname-select-prod');
    await page.waitForTimeout(500);

    await page.selectOption('#opname-item-dropdown', { index: 1 });
    await page.waitForTimeout(500);

    await page.fill('#opname-actual-input', '30');
    await page.fill('#opname-note-input', 'Opname E2E product');

    await page.click('#opname-submit-btn');

    await expect(page.locator('#modal-confirm-btn')).toBeVisible({ timeout: 5000 });
    await page.click('#modal-confirm-btn');
    await page.waitForTimeout(2000);
  });
});
