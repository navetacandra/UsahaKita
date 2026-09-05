import { test as base, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://usahakita.cfexpense-tracker123.workers.dev';
const EMAIL = 'e2e@test.com';
const PASSWORD = 'TestPass123!';
const BUSINESS_NAME = 'Toko E2E';

async function seedAndLogin(page) {
  // Seed the database
  const seedRes = await page.request.post(`${BASE_URL}/api/v1/auth/seed`, {
    data: { force: true },
  });
  expect(seedRes.ok()).toBeTruthy();

  // Try login first (seed creates owner@tokomaju.com / password123)
  await page.goto(`${BASE_URL}/#/login`);
  await page.waitForSelector('#login-email-input', { timeout: 10000 });

  await page.fill('#login-email-input', 'owner@tokomaju.com');
  await page.fill('#login-password-input', 'password123');
  await page.click('#login-submit-btn');

  // Wait for dashboard to load
  await page.waitForURL(/.*#\/dashboard/, { timeout: 15000 });
  await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
}

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await seedAndLogin(page);
    await use(page);
  },
});

export { expect, BASE_URL, EMAIL, PASSWORD, BUSINESS_NAME };
