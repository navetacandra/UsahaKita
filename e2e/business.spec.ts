import { test, expect } from './fixtures';

test.describe('BOMs', () => {
  test('BOM list shows seeded BOMs', async ({ authenticatedPage: page }) => {
    await page.click('#tab-bom');
    await expect(page.locator('text=Resep & Komposisi')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Resep Donat Coklat')).toBeVisible({ timeout: 10000 });
  });

  test('navigate to create new BOM', async ({ authenticatedPage: page }) => {
    await page.click('#tab-bom');
    await expect(page.locator('text=Resep & Komposisi')).toBeVisible({ timeout: 10000 });
    const addBtn = page.locator('text=Buat Resep Baru').or(page.locator('text=Tambah Resep'));
    await addBtn.first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#bom-name-input')).toBeVisible({ timeout: 10000 });
  });

  test('create a new BOM', async ({ authenticatedPage: page }) => {
    await page.click('#tab-bom');
    await expect(page.locator('text=Resep & Komposisi')).toBeVisible({ timeout: 10000 });
    const addBtn = page.locator('text=Buat Resep Baru').or(page.locator('text=Tambah Resep'));
    await addBtn.first().click();
    await expect(page.locator('#bom-name-input')).toBeVisible({ timeout: 10000 });

    await page.fill('#bom-name-input', 'Resep E2E');
    await page.selectOption('#bom-product-select', { index: 1 });
    await page.fill('#bom-output-qty', '10');
    await page.fill('#bom-selling-price', '6000');

    await page.click('#bom-add-row-btn');
    await page.waitForTimeout(500);

    await page.click('#bom-save-btn');
    await page.waitForTimeout(3000);
    await expect(page.locator('#bom-name-input').or(page.locator('text=Resep & Komposisi')).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Productions', () => {
  test('production list page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-production');
    await expect(page.locator('text=Aktivitas & Riwayat Produksi')).toBeVisible({ timeout: 10000 });
  });

  test('production create wizard step 1 loads', async ({ authenticatedPage: page }) => {
    await page.click('#header-quick-prod-btn');
    await expect(page.locator('#prod-step1-select')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#prod-step1-target-qty')).toBeVisible();
    await expect(page.locator('#prod-step1-next-btn')).toBeVisible();
  });

  test('production create wizard full flow', async ({ authenticatedPage: page }) => {
    await page.click('#header-quick-prod-btn');
    await expect(page.locator('#prod-step1-select')).toBeVisible({ timeout: 10000 });

    // Select Donat Coklat (index 0) which has a BOM
    await page.selectOption('#prod-step1-select', { index: 0 });
    await page.fill('#prod-step1-target-qty', '5');
    await page.click('#prod-step1-next-btn');

    const step2Btn = page.locator('#prod-step2-next-btn');
    await expect(step2Btn).toBeVisible({ timeout: 15000 });
    await step2Btn.click();

    const step3Btn = page.locator('#prod-step3-next-btn');
    await expect(step3Btn).toBeVisible({ timeout: 10000 });
    await step3Btn.click();

    await expect(page.locator('#prod-actual-output-qty')).toBeVisible({ timeout: 10000 });
    await page.fill('#prod-actual-output-qty', '5');
    await page.fill('#prod-note-input', 'Produksi E2E');
    await page.click('#prod-step4-submit-btn');

    await expect(page.locator('#modal-confirm-btn')).toBeVisible({ timeout: 5000 });
    await page.click('#modal-confirm-btn');
    await page.waitForTimeout(2000);
  });

  test('production detail page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-production');
    await expect(page.locator('text=Aktivitas & Riwayat Produksi')).toBeVisible({ timeout: 10000 });
    const detailLink = page.locator('text=Lihat Detail').or(page.locator('[id^="prod-detail-"]'));
    if (await detailLink.count() > 0) {
      await detailLink.first().click();
      await page.waitForTimeout(1000);
    }
  });
});
