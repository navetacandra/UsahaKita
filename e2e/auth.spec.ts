import { test, expect, BASE_URL } from './fixtures';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/login`);
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Masuk ke UsahaKita');
    await expect(page.locator('#login-email-input')).toBeVisible();
    await expect(page.locator('#login-password-input')).toBeVisible();
    await expect(page.locator('#login-submit-btn')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    const seedRes = await page.request.post(`${BASE_URL}/api/v1/auth/seed`, { data: { force: true } });
    expect(seedRes.ok()).toBeTruthy();

    await page.goto(`${BASE_URL}/#/login`);
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.fill('#login-email-input', 'wrong@email.com');
    await page.fill('#login-password-input', 'wrongpass');
    await page.click('#login-submit-btn');
    await expect(page.locator('.bg-rose-50')).toBeVisible({ timeout: 10000 });
  });

  test('seed then login with seeded credentials', async ({ page }) => {
    const seedRes = await page.request.post(`${BASE_URL}/api/v1/auth/seed`, { data: { force: true } });
    expect(seedRes.ok()).toBeTruthy();

    await page.goto(`${BASE_URL}/#/login`);
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
    await page.fill('#login-email-input', 'owner@tokomaju.com');
    await page.fill('#login-password-input', 'password123');
    await page.click('#login-submit-btn');

    await page.waitForURL(/.*#\/dashboard/, { timeout: 15000 });
    await expect(page.locator('text=Ringkasan Operasional Usaha')).toBeVisible({ timeout: 10000 });
  });

  test('register page loads and navigates back to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/register`);
    await page.waitForSelector('#reg-business-name', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Daftarkan Usaha Anda');
    await expect(page.locator('#goto-login-btn')).toBeVisible();
    await page.click('#goto-login-btn');
    await page.waitForSelector('#login-email-input', { timeout: 10000 });
  });

  test('register a new user', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/register`);
    await page.waitForSelector('#reg-business-name', { timeout: 10000 });
    await page.fill('#reg-business-name', 'Toko E2E');
    await page.fill('#reg-email', 'e2e-register@test.com');
    await page.fill('#reg-password', 'StrongPass123!');
    await page.click('#reg-submit-btn');

    await page.waitForURL(/.*#\/dashboard/, { timeout: 15000 });
    await expect(page.locator('text=Ringkasan Operasional Usaha')).toBeVisible({ timeout: 10000 });
  });
});
