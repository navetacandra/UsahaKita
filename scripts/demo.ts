/**
 * UsahaKita — Automated Feature Demo
 *
 * Launches a visible browser and walks through every feature of the app.
 * Screenshots saved to test-results/demo/
 *
 * Usage:
 *   npx tsx scripts/demo.ts              # local (vite dev on :5173)
 *   npx tsx scripts/demo.ts --deployed   # against deployed worker
 *
 * Prerequisites (local):
 *   pnpm exec vite dev   # must be running in another terminal
 */

import { chromium, type Page } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE_URL = process.argv.includes('--deployed')
  ? 'https://usahakita.cfexpense-tracker123.workers.dev'
  : 'http://localhost:5173';

const SCREENSHOT_DIR = 'test-results/demo';
let stepIndex = 0;

mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function snap(page: Page, label: string) {
  stepIndex++;
  const padded = String(stepIndex).padStart(2, '0');
  const file = `${SCREENSHOT_DIR}/${padded}-${label}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${file}`);
}

async function pause(ms: number) {
  await new Promise(r => setTimeout(r, ms));
}

async function waitAndClick(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.click(selector);
}

async function waitForText(page: Page, text: string, timeout = 10000) {
  await page.waitForSelector(`text=${text}`, { state: 'visible', timeout });
}

/**
 * Helper to click a material stock IN button by index.
 * Each button has id `mat-btn-in-{materialId}`.
 */
async function clickMatIn(page: Page, index = 0) {
  const btns = page.locator('[id^="mat-btn-in-"]');
  await btns.nth(index).click();
}

/**
 * Helper to click a product outgoing button by index.
 * Each button has id `prod-btn-out-{productId}`.
 */
async function clickProdOut(page: Page, index = 0) {
  const btns = page.locator('[id^="prod-btn-out-"]');
  await btns.nth(index).click();
}

(async () => {
  console.log(`\n🚀 UsahaKita Feature Demo — ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  try {
    // ─── 01. Login Page ──────────────────────────────────────────────
    console.log('01 — Login Page');
    await page.goto(`${BASE_URL}/#/login`);
    await waitAndClick(page, '#login-email-input');
    await snap(page, 'login-page');

    // ─── 02. Register Page ───────────────────────────────────────────
    console.log('02 — Register Page');
    await page.click('#goto-register-btn');
    await waitForText(page, 'Buat Akun & Masuk');
    await snap(page, 'register-page');
    await page.click('#goto-login-btn');
    await waitAndClick(page, '#login-email-input');

    // ─── 03. Seed Data & Login ───────────────────────────────────────
    console.log('03 — Seed & Login');
    await page.request.post(`${BASE_URL}/api/v1/auth/seed`, { data: { force: true } });
    await page.reload();
    await waitAndClick(page, '#login-email-input');
    await page.fill('#login-email-input', 'owner@tokomaju.com');
    await page.fill('#login-password-input', 'password123');
    await page.click('#login-submit-btn');
    await page.waitForURL(/.*#\/dashboard/, { timeout: 15000 });
    await waitForText(page, 'Ringkasan Operasional Usaha');
    await snap(page, 'dashboard');

    // ─── 04. Dashboard — Metric Cards ────────────────────────────────
    console.log('04 — Dashboard Metrics');
    await waitForText(page, 'Total Penjualan');
    await pause(500);
    await snap(page, 'dashboard-metrics');

    // ─── 05. Dashboard — AI Insight Section ──────────────────────────
    console.log('05 — Dashboard Insight');
    const insightBtn = page.locator('#dash-view-all-insights');
    if (await insightBtn.count() > 0) {
      await insightBtn.scrollIntoViewIfNeeded();
      await snap(page, 'dashboard-insight');
    }

    // ─── 06. Materials Page ──────────────────────────────────────────
    console.log('06 — Materials');
    await page.click('#tab-materials');
    await waitForText(page, 'Stok Bahan Baku & Material');
    await pause(500);
    await snap(page, 'materials-list');

    // ─── 07. Materials — Add Material Modal ──────────────────────────
    console.log('07 — Add Material Modal');
    await page.click('#mat-btn-add');
    await page.waitForSelector('text=Tambah Bahan Baku Baru', { timeout: 5000 });
    await snap(page, 'materials-add-modal');
    await page.click('button:text("Batal")');
    await page.waitForSelector('text=Tambah Bahan Baku Baru', { state: 'hidden', timeout: 5000 });
    await pause(300);

    // ─── 08. Materials — Stock IN Movement ───────────────────────────
    console.log('08 — Material Stock IN');
    await clickMatIn(page, 0);
    await page.waitForSelector('text=Catat Stok Masuk (Bahan)', { timeout: 5000 });
    // Fill qty (first input in the modal body) and reason (placeholder)
    const matQtyInput = page.locator('input[type="number"]').last();
    const matReasonInput = page.getByPlaceholder('Contoh: Belanja pasar pagi');
    await matQtyInput.fill('10');
    await matReasonInput.fill('Restock dari supplier');
    await snap(page, 'materials-stock-in-modal');
    await page.click('button:text("Batal")');
    await page.waitForSelector('text=Catat Stok Masuk (Bahan)', { state: 'hidden', timeout: 5000 });
    await pause(300);

    // ─── 09. Products Page ───────────────────────────────────────────
    console.log('09 — Products');
    await page.click('#tab-products');
    await waitForText(page, 'Stok Produk Jadi');
    await pause(500);
    await snap(page, 'products-list');

    // ─── 10. Products — Add Product Modal ────────────────────────────
    console.log('10 — Add Product Modal');
    await page.click('#prod-btn-add');
    await page.waitForSelector('text=Tambah Produk Jadi Baru', { timeout: 5000 });
    await snap(page, 'products-add-modal');
    await page.click('button:text("Batal")');
    await page.waitForSelector('text=Tambah Produk Jadi Baru', { state: 'hidden', timeout: 5000 });
    await pause(300);

    // ─── 11. Products — Outgoing Modal ──────────────────────────────
    console.log('11 — Product Outgoing');
    await clickProdOut(page, 0);
    await page.waitForSelector('text=Catat Produk Keluar', { timeout: 5000 });
    await snap(page, 'products-outgoing-modal');
    await page.click('button:text("Batal")');
    await page.waitForSelector('text=Catat Produk Keluar', { state: 'hidden', timeout: 5000 });
    await pause(300);

    // ─── 12. Movements Page ──────────────────────────────────────────
    console.log('12 — Movements');
    await page.click('#tab-movements');
    await waitForText(page, 'Riwayat Mutasi');
    await pause(500);
    await snap(page, 'movements-list');

    // ─── 13. Movements — Filter Buttons ─────────────────────────────
    console.log('13 — Movements Filters');
    await page.click('#filter-mov-material');
    await pause(400);
    await snap(page, 'movements-filter-material');
    await page.click('#filter-mov-all');
    await pause(400);

    // ─── 14. Stock Opname Page ───────────────────────────────────────
    console.log('14 — Stock Opname');
    await page.click('#tab-opname');
    await waitForText(page, 'Stok Opname (Penyesuaian Fisik)');
    await pause(500);
    await snap(page, 'stock-opname-page');

    // ─── 15. Stock Opname — Material Selection ───────────────────────
    console.log('15 — Opname Material Select');
    await page.click('#opname-select-mat');
    await page.waitForFunction(
      () => document.querySelectorAll('#opname-item-dropdown option[value]').length > 1,
      { timeout: 10000 }
    );
    await page.selectOption('#opname-item-dropdown', { index: 1 });
    await pause(500);
    await snap(page, 'stock-opname-material-selected');

    // ─── 16. BoM List Page ───────────────────────────────────────────
    console.log('16 — BoM List');
    await page.click('#tab-bom');
    await waitForText(page, 'Resep & Komposisi');
    await pause(500);
    await snap(page, 'bom-list');

    // ─── 17. BoM Editor — Create New ────────────────────────────────
    console.log('17 — BoM Editor');
    await page.click('#bom-btn-create');
    await waitAndClick(page, '#bom-name-input');
    await pause(500);
    await snap(page, 'bom-editor-new');

    // ─── 18. Production List Page ────────────────────────────────────
    console.log('18 — Production List');
    await page.click('#tab-production');
    await waitForText(page, 'Aktivitas & Riwayat Produksi');
    await pause(500);
    await snap(page, 'production-list');

    // ─── 19. Production Create — Step 1 ─────────────────────────────
    console.log('19 — Production Wizard Step 1');
    await page.click('#prod-btn-new');
    await waitAndClick(page, '#prod-step1-select');
    await pause(500);
    await snap(page, 'production-step1');

    // ─── 20. Production Create — Step 1 to 2 ────────────────────────
    console.log('20 — Production Wizard Step 1→2');
    await page.selectOption('#prod-step1-select', { index: 0 });
    await page.fill('#prod-step1-target-qty', '10');
    await page.click('#prod-step1-next-btn');
    await waitForText(page, 'Kalkulasi Resep', { timeout: 10000 });
    await pause(500);
    await snap(page, 'production-step2');

    // ─── 21. Production Create — Step 2 to 3 ────────────────────────
    console.log('21 — Production Wizard Step 2→3');
    await page.click('#prod-step2-next-btn');
    await waitForText(page, 'Penyesuaian', { timeout: 10000 });
    await pause(500);
    await snap(page, 'production-step3');

    // ─── 22. Production Create — Step 3 to 4 ────────────────────────
    console.log('22 — Production Wizard Step 3→4');
    await page.click('#prod-step3-next-btn');
    await waitAndClick(page, '#prod-actual-output-qty', 10000);
    await pause(500);
    await snap(page, 'production-step4');
    await page.keyboard.press('Escape'); // leave wizard without committing

    // ─── 23. POS Page ────────────────────────────────────────────────
    console.log('23 — POS');
    await page.click('#tab-pos');
    await waitForText(page, 'Kasir Penjualan');
    await pause(500);
    await snap(page, 'pos-page');

    // ─── 24. POS — Add Product to Cart ──────────────────────────────
    console.log('24 — POS Add to Cart');
    const posCard = page.locator('[id^="pos-add-"]').first();
    if (await posCard.count() > 0) {
      await posCard.click();
      await pause(500);
      await snap(page, 'pos-cart-with-item');

    // ─── 25. POS — Checkout ──────────────────────────────────────
    console.log('25 — POS Checkout');
    await page.click('#pos-submit-btn');
    await page.waitForSelector('#modal-confirm-btn', { timeout: 5000 });
    await snap(page, 'pos-checkout-modal');
    await page.click('#modal-confirm-btn');
    await waitForText(page, 'Transaksi Berhasil!', { timeout: 10000 });
    await pause(500);
    await snap(page, 'pos-receipt');
    await page.click('button:text("Transaksi Baru")');
    await pause(300);
    }

    // ─── 26. Sales History Page ──────────────────────────────────────
    console.log('26 — Sales History');
    await page.click('#tab-sales');
    await waitForText(page, 'Riwayat Transaksi Penjualan');
    await pause(500);
    await snap(page, 'sales-history');

    // ─── 27. Insights Page ───────────────────────────────────────────
    console.log('27 — Insights');
    await page.click('#tab-insights');
    await waitForText(page, 'Insight & Rekomendasi Bisnis');
    await pause(500);
    await snap(page, 'insights-page');

    // ─── 28. Settings Page ───────────────────────────────────────────
    console.log('28 — Settings');
    await page.click('#tab-settings');
    await waitForText(page, 'Pengaturan & Profil Usaha');
    await pause(500);
    await snap(page, 'settings-page');

    // ─── 29. Settings — Business Identity ────────────────────────────
    console.log('29 — Settings Business Identity');
    await waitForText(page, 'Identitas Toko');
    await snap(page, 'settings-business');

    // ─── 30. Header — Quick Navigation Buttons ───────────────────────
    console.log('30 — Header Quick POS');
    await page.click('#header-quick-pos-btn');
    await waitAndClick(page, '#pos-search-input', 5000);
    await snap(page, 'header-quick-pos');

    console.log('31 — Header Quick Production');
    await page.click('#header-quick-prod-btn');
    await waitAndClick(page, '#prod-step1-select', 5000);
    await snap(page, 'header-quick-production');

    console.log('32 — Header Quick Insight');
    await page.click('#header-quick-insight-btn');
    await waitForText(page, 'Insight & Rekomendasi Bisnis', { timeout: 5000 });
    await snap(page, 'header-quick-insight');

    // ─── 33. Dashboard — Quick Action Navigation ─────────────────────
    console.log('33 — Dashboard Quick Actions');
    await page.click('#tab-dashboard');
    await waitForText(page, 'Ringkasan Operasional Usaha');
    await page.click('#dash-quick-pos');
    await waitAndClick(page, '#pos-search-input', 5000);
    await page.click('#tab-dashboard');
    await waitForText(page, 'Ringkasan Operasional Usaha');
    await page.click('#dash-quick-production');
    await waitAndClick(page, '#prod-step1-select', 5000);
    await page.click('#tab-dashboard');
    await waitForText(page, 'Ringkasan Operasional Usaha');
    await snap(page, 'dashboard-final');

    // ─── 34. Logout ──────────────────────────────────────────────────
    console.log('34 — Logout');
    await page.click('#header-logout-btn');
    await waitAndClick(page, '#login-email-input', 5000);
    await snap(page, 'logged-out');

  } finally {
    await browser.close();
  }

  console.log(`\n✅ Demo complete — ${stepIndex} screenshots saved to ${SCREENSHOT_DIR}/\n`);
})().catch((err) => {
  console.error('❌ Demo failed:', err);
  process.exit(1);
});
