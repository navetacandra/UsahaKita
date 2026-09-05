import { test, expect } from './fixtures';

test.describe('Insights', () => {
  test('insights page loads', async ({ authenticatedPage: page }) => {
    await page.click('#tab-insights');
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
  });

  test('insights shows recommendations section', async ({ authenticatedPage: page }) => {
    await page.click('#tab-insights');
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Rekomendasi Tindakan' })).toBeVisible({ timeout: 10000 });
  });

  test('insights shows top products section', async ({ authenticatedPage: page }) => {
    await page.click('#tab-insights');
    await expect(page.locator('text=Insight & Rekomendasi Bisnis')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Produk Paling Laris' })).toBeVisible({ timeout: 10000 });
  });
});
