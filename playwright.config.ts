import { defineConfig } from '@playwright/test';

const isLocal = process.env.E2E_LOCAL === 'true';
const baseURL = isLocal
  ? (process.env.BASE_URL || 'http://localhost:5173')
  : (process.env.BASE_URL || 'https://usahakita.cfexpense-tracker123.workers.dev');

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  webServer: isLocal
    ? {
        command: 'pnpm exec vite dev',
        port: 5173,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
