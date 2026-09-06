/**
 * UsahaKita — Humanized Automated Demo
 *
 * Launches a visible browser and walks through every feature like a real person.
 * Uses realistic typing, variable delays, hover effects, and natural scrolling.
 *
 * Usage:
 *   npx tsx scripts/demo.ts              # local (vite dev on :5173)
 *   npx tsx scripts/demo.ts --deployed   # against deployed worker
 */

import { chromium, type Page, type Locator } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE_URL = process.argv.includes('--deployed')
  ? 'https://usahakita.cfexpense-tracker123.workers.dev'
  : 'http://localhost:5173';

const SCREENSHOT_DIR = 'test-results/demo';
let stepIndex = 0;

mkdirSync(SCREENSHOT_DIR, { recursive: true });

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function snap(page: Page, label: string) {
  stepIndex++;
  const padded = String(stepIndex).padStart(2, '0');
  const file = `${SCREENSHOT_DIR}/${padded}-${label}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  📸 ${file}`);
}

async function think(ms?: number) {
  await new Promise(r => setTimeout(r, ms ?? rand(600, 1400)));
}

async function readPause() {
  await new Promise(r => setTimeout(r, rand(1200, 2500)));
}

/** Hover then click — like a human moving the mouse first */
async function hoverClick(locator: Locator) {
  await locator.hover();
  await new Promise(r => setTimeout(r, rand(150, 400)));
  await locator.click();
}

/** Type text character by character like a human */
async function humanType(page: Page, selector: string, text: string) {
  await page.click(selector);
  await new Promise(r => setTimeout(r, rand(200, 500)));
  for (const char of text) {
    await page.keyboard.type(char, { delay: rand(40, 120) });
  }
}

/** Scroll element into view with a natural pause */
async function scrollInto(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await new Promise(r => setTimeout(r, rand(300, 600)));
}

/** Wait for selector then hover + click */
async function waitHoverClick(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await hoverClick(page.locator(selector));
}

async function waitForText(page: Page, text: string, timeout = 10000) {
  await page.waitForSelector(`text=${text}`, { state: 'visible', timeout });
}

async function clickMatIn(page: Page, index = 0) {
  const btn = page.locator('[id^="mat-btn-in-"]').nth(index);
  await hoverClick(btn);
}

async function clickProdOut(page: Page, index = 0) {
  const btn = page.locator('[id^="prod-btn-out-"]').nth(index);
  await hoverClick(btn);
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
    await page.waitForSelector('#login-email-input', { state: 'visible', timeout: 10000 });
    await think();
    await snap(page, 'login-page');

    // ─── 02. Register Page ───────────────────────────────────────────
    console.log('02 — Register Page');
    await hoverClick(page.locator('#goto-register-btn'));
    await waitForText(page, 'Buat Akun & Masuk');
    await readPause();
    await snap(page, 'register-page');
    await hoverClick(page.locator('#goto-login-btn'));
    await page.waitForSelector('#login-email-input', { state: 'visible', timeout: 10000 });
    await think();

    // ─── 03. Seed Data & Login ───────────────────────────────────────
    console.log('03 — Seed & Login');
    await page.request.post(`${BASE_URL}/api/v1/auth/seed`, { data: { force: true } });
    await page.reload();
    await page.waitForSelector('#login-email-input', { state: 'visible', timeout: 10000 });
    await think(300);

    // Type credentials character by character
    await humanType(page, '#login-email-input', 'owner@tokomaju.com');
    await think(300);
    await humanType(page, '#login-password-input', 'password123');
    await think(500);
    await hoverClick(page.locator('#login-submit-btn'));
    // Wait for either dashboard URL or any post-login navigation
    await Promise.race([
      page.waitForURL(/.*#\/dashboard/, { timeout: 15000 }),
      page.waitForSelector('text=Ringkasan Operasional Usaha', { timeout: 15000 }),
    ]).catch(() => {});
    await waitForText(page, 'Ringkasan Operasional Usaha', { timeout: 15000 });
    await readPause();
    await snap(page, 'dashboard');

    // ─── 04. Dashboard — Metric Cards ────────────────────────────────
    console.log('04 — Dashboard Metrics');
    await waitForText(page, 'Total Penjualan');
    await readPause();
    await snap(page, 'dashboard-metrics');

    // ─── 05. Dashboard — AI Insight Section ──────────────────────────
    console.log('05 — Dashboard Insight');
    const insightBtn = page.locator('#dash-view-all-insights');
    if (await insightBtn.count() > 0) {
      await scrollInto(page, '#dash-view-all-insights');
      await readPause();
      await snap(page, 'dashboard-insight');
    }

    // ─── 06. Materials Page ──────────────────────────────────────────
    console.log('06 — Materials');
    await hoverClick(page.locator('#tab-materials'));
    await waitForText(page, 'Stok Bahan Baku & Material');
    await readPause();
    await snap(page, 'materials-list');

    // ─── 07. Materials — Add Material Modal ──────────────────────────
    console.log('07 — Add Material Modal');
    await hoverClick(page.locator('#mat-btn-add'));
    await page.waitForSelector('text=Tambah Bahan Baku Baru', { timeout: 5000 });
    await think();
    await snap(page, 'materials-add-modal');
    await hoverClick(page.locator('button:text("Batal")'));
    await page.waitForSelector('text=Tambah Bahan Baku Baru', { state: 'hidden', timeout: 5000 });
    await think();

    // ─── 08. Materials — Stock IN Movement ───────────────────────────
    console.log('08 — Material Stock IN');
    await clickMatIn(page, 0);
    await page.waitForSelector('text=Catat Stok Masuk (Bahan)', { timeout: 5000 });
    await think(300);
    // Type quantity like a human
    const matQtyInput = page.locator('input[type="number"]').last();
    await matQtyInput.click();
    await new Promise(r => setTimeout(r, rand(200, 400)));
    await page.keyboard.type('10', { delay: rand(60, 130) });
    await think(200);
    const matReasonInput = page.getByPlaceholder('Contoh: Belanja pasar pagi');
    await matReasonInput.click();
    await new Promise(r => setTimeout(r, rand(200, 400)));
    await page.keyboard.type('Restock dari supplier', { delay: rand(40, 100) });
    await think();
    await snap(page, 'materials-stock-in-modal');
    await hoverClick(page.locator('button:text("Batal")'));
    await page.waitForSelector('text=Catat Stok Masuk (Bahan)', { state: 'hidden', timeout: 5000 });
    await think();

    // ─── 09. Products Page ───────────────────────────────────────────
    console.log('09 — Products');
    await hoverClick(page.locator('#tab-products'));
    await waitForText(page, 'Stok Produk Jadi');
    await readPause();
    await snap(page, 'products-list');

    // ─── 10. Products — Add Product Modal ────────────────────────────
    console.log('10 — Add Product Modal');
    await hoverClick(page.locator('#prod-btn-add'));
    await page.waitForSelector('text=Tambah Produk Jadi Baru', { timeout: 5000 });
    await think();
    await snap(page, 'products-add-modal');
    await hoverClick(page.locator('button:text("Batal")'));
    await page.waitForSelector('text=Tambah Produk Jadi Baru', { state: 'hidden', timeout: 5000 });
    await think();

    // ─── 11. Products — Outgoing Modal ──────────────────────────────
    console.log('11 — Product Outgoing');
    await clickProdOut(page, 0);
    await page.waitForSelector('text=Catat Produk Keluar', { timeout: 5000 });
    await think();
    await snap(page, 'products-outgoing-modal');
    await hoverClick(page.locator('button:text("Batal")'));
    await page.waitForSelector('text=Catat Produk Keluar', { state: 'hidden', timeout: 5000 });
    await think();

    // ─── 12. Movements Page ──────────────────────────────────────────
    console.log('12 — Movements');
    await hoverClick(page.locator('#tab-movements'));
    await waitForText(page, 'Riwayat Mutasi');
    await readPause();
    await snap(page, 'movements-list');

    // ─── 13. Movements — Filter Buttons ─────────────────────────────
    console.log('13 — Movements Filters');
    await hoverClick(page.locator('#filter-mov-material'));
    await readPause();
    await snap(page, 'movements-filter-material');
    await hoverClick(page.locator('#filter-mov-all'));
    await think();

    // ─── 14. Stock Opname Page ───────────────────────────────────────
    console.log('14 — Stock Opname');
    await hoverClick(page.locator('#tab-opname'));
    await waitForText(page, 'Stok Opname (Penyesuaian Fisik)');
    await readPause();
    await snap(page, 'stock-opname-page');

    // ─── 15. Stock Opname — Material Selection ───────────────────────
    console.log('15 — Opname Material Select');
    await hoverClick(page.locator('#opname-select-mat'));
    await page.waitForFunction(
      () => document.querySelectorAll('#opname-item-dropdown option[value]').length > 1,
      { timeout: 10000 }
    );
    await think(300);
    await page.selectOption('#opname-item-dropdown', { index: 1 });
    await readPause();
    await snap(page, 'stock-opname-material-selected');

    // ─── 16. BoM List Page ───────────────────────────────────────────
    console.log('16 — BoM List');
    await hoverClick(page.locator('#tab-bom'));
    await waitForText(page, 'Resep & Komposisi');
    await readPause();
    await snap(page, 'bom-list');

    // ─── 17. BoM Editor — Create New ────────────────────────────────
    console.log('17 — BoM Editor');
    await hoverClick(page.locator('#bom-btn-create'));
    await page.waitForSelector('#bom-name-input', { state: 'visible', timeout: 10000 });
    await think();
    await snap(page, 'bom-editor-new');

    // Navigate back: wait for #bom-btn-create which only exists on list page
    await hoverClick(page.locator('#tab-bom'));
    await page.waitForSelector('#bom-btn-create', { state: 'visible', timeout: 10000 });
    await readPause();
    await snap(page, 'bom-list-after-create');

    // ─── 18. Production List Page ────────────────────────────────────
    console.log('18 — Production List');
    await hoverClick(page.locator('#tab-production'));
    await waitForText(page, 'Aktivitas & Riwayat Produksi');
    await readPause();
    await snap(page, 'production-list');

    // ─── 19. Production Create — Step 1 ─────────────────────────────
    console.log('19 — Production Wizard Step 1');
    await hoverClick(page.locator('#prod-btn-new'));
    await page.waitForSelector('#prod-step1-select', { state: 'visible', timeout: 10000 });
    await think();
    await snap(page, 'production-step1');

    // ─── 20. Production Create — Step 1 to 2 ────────────────────────
    console.log('20 — Production Wizard Step 1→2');
    await page.selectOption('#prod-step1-select', { index: 0 });
    await think(300);
    await page.click('#prod-step1-target-qty');
    await new Promise(r => setTimeout(r, rand(200, 400)));
    await page.keyboard.type('10', { delay: rand(60, 130) });
    await think(300);
    await hoverClick(page.locator('#prod-step1-next-btn'));
    await waitForText(page, 'Kalkulasi Resep', { timeout: 10000 });
    await readPause();
    await snap(page, 'production-step2');

    // ─── 21. Production Create — Step 2 to 3 ────────────────────────
    console.log('21 — Production Wizard Step 2→3');
    await hoverClick(page.locator('#prod-step2-next-btn'));
    await waitForText(page, 'Penyesuaian', { timeout: 10000 });
    await readPause();
    await snap(page, 'production-step3');

    // ─── 22. Production Create — Step 3 to 4 ────────────────────────
    console.log('22 — Production Wizard Step 3→4');
    // Step 3 button may be disabled if stock insufficient — check first
    const step3Btn = page.locator('#prod-step3-next-btn');
    await step3Btn.waitFor({ state: 'visible', timeout: 10000 });
    const isDisabled = await step3Btn.getAttribute('disabled');
    if (isDisabled === null) {
      await hoverClick(step3Btn);
      await page.waitForSelector('#prod-actual-output-qty', { state: 'visible', timeout: 10000 });
      await think();
      await snap(page, 'production-step4');
    } else {
      await snap(page, 'production-step3-stock-warning');
    }
    await page.keyboard.press('Escape');

    // ─── 23. POS Page ────────────────────────────────────────────────
    console.log('23 — POS');
    await hoverClick(page.locator('#tab-pos'));
    await waitForText(page, 'Kasir Penjualan');
    await readPause();
    await snap(page, 'pos-page');

    // ─── 24. POS — Add Product to Cart ──────────────────────────────
    console.log('24 — POS Add to Cart');
    const posCard = page.locator('[id^="pos-add-"]').first();
    if (await posCard.count() > 0) {
      await hoverClick(posCard);
      await think();
      await snap(page, 'pos-cart-with-item');

    // ─── 25. POS — Checkout ──────────────────────────────────────
    console.log('25 — POS Checkout');
    await hoverClick(page.locator('#pos-submit-btn'));
    await page.waitForSelector('#modal-confirm-btn', { timeout: 5000 });
    await think();
    await snap(page, 'pos-checkout-modal');
    await hoverClick(page.locator('#modal-confirm-btn'));
    await waitForText(page, 'Transaksi Berhasil!', { timeout: 10000 });
    await readPause();
    await snap(page, 'pos-receipt');
    await hoverClick(page.locator('button:text("Transaksi Baru")'));
    await think();
    }

    // ─── 26. Sales History Page ──────────────────────────────────────
    console.log('26 — Sales History');
    await hoverClick(page.locator('#tab-sales'));
    await waitForText(page, 'Riwayat Transaksi Penjualan');
    await readPause();
    await snap(page, 'sales-history');

    // ─── 27. Insights Page ───────────────────────────────────────────
    console.log('27 — Insights');
    await hoverClick(page.locator('#tab-insights'));
    await waitForText(page, 'Insight & Rekomendasi Bisnis');
    await readPause();
    await snap(page, 'insights-page');

    // ─── 28. Settings Page ───────────────────────────────────────────
    console.log('28 — Settings');
    await hoverClick(page.locator('#tab-settings'));
    await waitForText(page, 'Pengaturan & Profil Usaha');
    await readPause();
    await snap(page, 'settings-page');

    // ─── 29. Settings — Business Identity ────────────────────────────
    console.log('29 — Settings Business Identity');
    await waitForText(page, 'Identitas Toko');
    await scrollInto(page, 'text=Identitas Toko');
    await readPause();
    await snap(page, 'settings-business');

    // ─── 30. Header — Quick Navigation Buttons ───────────────────────
    console.log('30 — Header Quick POS');
    await hoverClick(page.locator('#header-quick-pos-btn'));
    await page.waitForSelector('#pos-search-input', { state: 'visible', timeout: 5000 });
    await think();
    await snap(page, 'header-quick-pos');

    console.log('31 — Header Quick Production');
    await hoverClick(page.locator('#header-quick-prod-btn'));
    await page.waitForSelector('#prod-step1-select', { state: 'visible', timeout: 5000 });
    await think();
    await snap(page, 'header-quick-production');

    console.log('32 — Header Quick Insight');
    await hoverClick(page.locator('#header-quick-insight-btn'));
    await waitForText(page, 'Insight & Rekomendasi Bisnis', { timeout: 5000 });
    await think();
    await snap(page, 'header-quick-insight');

    // ─── 33. Dashboard — Quick Action Navigation ─────────────────────
    console.log('33 — Dashboard Quick Actions');
    await hoverClick(page.locator('#tab-dashboard'));
    await waitForText(page, 'Ringkasan Operasional Usaha');
    await think(300);
    await hoverClick(page.locator('#dash-quick-pos'));
    await page.waitForSelector('#pos-search-input', { state: 'visible', timeout: 5000 });
    await think(300);
    await hoverClick(page.locator('#tab-dashboard'));
    await waitForText(page, 'Ringkasan Operasional Usaha');
    await think(300);
    await hoverClick(page.locator('#dash-quick-production'));
    await page.waitForSelector('#prod-step1-select', { state: 'visible', timeout: 5000 });
    await think(300);
    await hoverClick(page.locator('#tab-dashboard'));
    await waitForText(page, 'Ringkasan Operasional Usaha');
    await readPause();
    await snap(page, 'dashboard-final');

    // ─── 34. Logout ──────────────────────────────────────────────────
    console.log('34 — Logout');
    await hoverClick(page.locator('#header-logout-btn'));
    await page.waitForSelector('#login-email-input', { state: 'visible', timeout: 5000 });
    await think();
    await snap(page, 'logged-out');

  } finally {
    await browser.close();
  }

  console.log(`\n✅ Demo complete — ${stepIndex} screenshots saved to ${SCREENSHOT_DIR}/\n`);
})().catch((err) => {
  console.error('❌ Demo failed:', err);
  process.exit(1);
});
