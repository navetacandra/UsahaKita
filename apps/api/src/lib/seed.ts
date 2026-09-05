const SEED_DATE = '2026-09-05T08:00:00.000Z';
const TWO_DAYS_AGO = '2026-09-03T08:00:00.000Z';
const FOUR_HOURS_AGO = '2026-09-05T04:00:00.000Z';
const ONE_DAY_AGO = '2026-09-04T08:00:00.000Z';
const TEN_DAYS_AGO = '2026-08-26T08:00:00.000Z';
const TWELVE_HOURS_AGO = '2026-09-05T00:00:00.000Z';
const THIRTEEN_HOURS_AGO = '2026-09-04T23:00:00.000Z';

export function getAuthSeedSQL(): string[] {
  return [
    `INSERT OR IGNORE INTO users (id, email, password_hash, password_salt, created_at)
     VALUES ('usr_01', 'owner@tokomaju.com', 'a1b2c3d4e5f6', 'salt123', '${SEED_DATE}');`,

    `INSERT OR IGNORE INTO tenants (id, name, description, created_at, updated_at)
     VALUES ('ten_01', 'Toko Maju', 'Usaha produksi dan penjualan makanan rumahan', '${SEED_DATE}', '${SEED_DATE}');`,

    `INSERT OR IGNORE INTO tenant_members (tenant_id, user_id, role, created_at)
     VALUES ('ten_01', 'usr_01', 'OWNER', '${SEED_DATE}');`,
  ];
}

export function getTenantSeedSQL(): string[] {
  return [
    // Materials
    `INSERT OR IGNORE INTO materials (id, name, unit, quantity_precision, current_stock, minimum_stock, created_at, updated_at)
     VALUES ('mat_01', 'Tepung Terigu', 'kg', 2, 12.5, 5, '${SEED_DATE}', '${SEED_DATE}');`,

    `INSERT OR IGNORE INTO materials (id, name, unit, quantity_precision, current_stock, minimum_stock, created_at, updated_at)
     VALUES ('mat_02', 'Telur Ayam', 'pcs', 0, 24, 20, '${SEED_DATE}', '${SEED_DATE}');`,

    `INSERT OR IGNORE INTO materials (id, name, unit, quantity_precision, current_stock, minimum_stock, created_at, updated_at)
     VALUES ('mat_03', 'Gula Pasir', 'kg', 2, 4.5, 2, '${SEED_DATE}', '${SEED_DATE}');`,

    `INSERT OR IGNORE INTO materials (id, name, unit, quantity_precision, current_stock, minimum_stock, created_at, updated_at)
     VALUES ('mat_04', 'Minyak Goreng', 'liter', 1, 6, 3, '${SEED_DATE}', '${SEED_DATE}');`,

    `INSERT OR IGNORE INTO materials (id, name, unit, quantity_precision, current_stock, minimum_stock, created_at, updated_at)
     VALUES ('mat_05', 'Coklat Batang', 'kg', 2, 1.2, 2, '${SEED_DATE}', '${SEED_DATE}');`,

    // Products
    `INSERT OR IGNORE INTO products (id, name, unit, current_stock, minimum_stock, created_at, updated_at)
     VALUES ('prd_01', 'Donat Coklat', 'pcs', 35, 20, '${SEED_DATE}', '${SEED_DATE}');`,

    `INSERT OR IGNORE INTO products (id, name, unit, current_stock, minimum_stock, created_at, updated_at)
     VALUES ('prd_02', 'Roti Manis Keju', 'pcs', 15, 15, '${SEED_DATE}', '${SEED_DATE}');`,

    // Inventory Movements
    `INSERT OR IGNORE INTO inventory_movements (id, item_type, item_id, movement_type, quantity, stock_before, stock_after, reason_type, reason_note, created_at)
     VALUES ('mov_01', 'MATERIAL', 'mat_01', 'IN', 10, 2.5, 12.5, 'PURCHASE', 'Pembelian bahan baku mingguan', '${TWO_DAYS_AGO}');`,

    `INSERT OR IGNORE INTO inventory_movements (id, item_type, item_id, movement_type, quantity, stock_before, stock_after, reason_type, reason_note, reference_type, reference_id, created_at)
     VALUES ('mov_02', 'PRODUCT', 'prd_01', 'SALE', 5, 40, 35, null, 'Penjualan kasir #TRX-8821', 'SALE', 'sale_01', '${FOUR_HOURS_AGO}');`,

    // BOMs
    `INSERT OR IGNORE INTO boms (id, name, product_id, output_quantity, output_unit, selling_price_per_unit, created_at, updated_at)
     VALUES ('bom_01', 'Resep Donat Coklat', 'prd_01', 20, 'pcs', 5000, '${TEN_DAYS_AGO}', '${TEN_DAYS_AGO}');`,

    `INSERT OR IGNORE INTO bom_materials (bom_id, material_id, quantity)
     VALUES ('bom_01', 'mat_01', 1);`,

    `INSERT OR IGNORE INTO bom_materials (bom_id, material_id, quantity)
     VALUES ('bom_01', 'mat_03', 0.3);`,

    `INSERT OR IGNORE INTO bom_materials (bom_id, material_id, quantity)
     VALUES ('bom_01', 'mat_02', 10);`,

    `INSERT OR IGNORE INTO bom_materials (bom_id, material_id, quantity)
     VALUES ('bom_01', 'mat_05', 0.4);`,

    // Productions
    `INSERT OR IGNORE INTO productions (id, bom_id, product_id, target_output_quantity, actual_output_quantity, bom_multiplier, note, created_at)
     VALUES ('prod_01', 'bom_01', 'prd_01', 20, 20, 1.0, 'Produksi batch pagi lancar', '${ONE_DAY_AGO}');`,

    `INSERT OR IGNORE INTO production_materials (production_id, material_id, calculated_quantity, actual_quantity)
     VALUES ('prod_01', 'mat_01', 1, 1);`,

    `INSERT OR IGNORE INTO production_materials (production_id, material_id, calculated_quantity, actual_quantity)
     VALUES ('prod_01', 'mat_03', 0.3, 0.3);`,

    `INSERT OR IGNORE INTO production_materials (production_id, material_id, calculated_quantity, actual_quantity)
     VALUES ('prod_01', 'mat_02', 10, 10);`,

    // Sales
    `INSERT OR IGNORE INTO sales (id, total, created_at)
     VALUES ('sale_01', 25000, '${FOUR_HOURS_AGO}');`,

    `INSERT OR IGNORE INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
     VALUES ('sale_01', 'prd_01', 5, 5000, 25000);`,

    // AI Insights
    `INSERT OR IGNORE INTO ai_insights (id, period_from, period_to, data_as_of, generated_at, prompt_version, content_json, model_metadata_json)
     VALUES ('ins_01', '2026-09-01', '2026-09-05', '${THIRTEEN_HOURS_AGO}', '${TWELVE_HOURS_AGO}', '1.0.0',
       '[{"type":"WARNING","title":"Stok Coklat Batang di bawah batas minimum","body":"Sisa stok Coklat Batang saat ini 1.2 kg (minimum 2 kg). Jika ingin memproduksi 20 pcs Donat Coklat, Anda membutuhkan 0.4 kg lagi."},{"type":"OPPORTUNITY","title":"Donat Coklat adalah produk terlaris minggu ini","body":"Penjualan Donat Coklat stabil tinggi. Pertimbangkan untuk menyiapkan batch produksi 40 pcs menjelang akhir pekan."},{"type":"TIP","title":"Lakukan stok opname berkala","body":"Cocokkan stok telur fisik dengan pencatatan sistem untuk mengantisipasi telur pecah atau susut."}]',
       '{"provider":"rule-based","model":"builtin"}');`,
  ];
}
