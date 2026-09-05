import { test, expect } from './fixtures';

test.describe('Settings', () => {
  test('settings page loads with business info', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
  });

  test('settings shows business identity section', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Identitas Toko' })).toBeVisible({ timeout: 10000 });
  });

  test('settings shows account section', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Akun Pemilik' })).toBeVisible({ timeout: 10000 });
  });

  test('settings shows logout button', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Keluar dari Akun')).toBeVisible({ timeout: 10000 });
  });

  test('settings shows reset section', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Reset Data Sampel' })).toBeVisible({ timeout: 10000 });
  });

  test('logout from settings page', async ({ authenticatedPage: page }) => {
    await page.click('#tab-settings');
    await expect(page.locator('text=Pengaturan & Profil Usaha')).toBeVisible({ timeout: 10000 });
    await page.click('#header-logout-btn');
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Masuk ke UsahaKita');
  });
});
