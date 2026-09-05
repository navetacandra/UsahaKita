import { test as base, expect } from '@playwright/test';

const isLocal = process.env.E2E_LOCAL === 'true';
const BASE_URL = isLocal
  ? (process.env.BASE_URL || 'http://127.0.0.1:8787')
  : (process.env.BASE_URL || 'https://usahakita.cfexpense-tracker123.workers.dev');

async function seedAndLogin(page) {
  const seedRes = await page.request.post(`${BASE_URL}/api/v1/auth/seed`, {
    data: { force: true },
  });
  expect(seedRes.ok()).toBeTruthy();

  await page.goto(`${BASE_URL}/#/login`);
  await page.waitForSelector('#login-email-input');

  await page.fill('#login-email-input', 'owner@tokomaju.com');
  await page.fill('#login-password-input', 'password123');
  await page.click('#login-submit-btn');

  await page.waitForURL(/.*#\/dashboard/, { timeout: 15000 });
  await expect(page.locator('text=Ringkasan Operasional Usaha')).toBeVisible({ timeout: 10000 });
}

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await seedAndLogin(page);
    await use(page);
  },
});

export { expect, BASE_URL };
