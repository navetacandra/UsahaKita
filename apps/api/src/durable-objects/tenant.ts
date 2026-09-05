import { DurableObject } from 'cloudflare:workers';
import { idGenerator } from '../lib/id';
import { getTenantSeedSQL } from '../lib/seed';

export class TenantDO extends DurableObject {
  private sql!: SqlStorage;

  constructor(state: DurableObjectState, env: unknown) {
    super(state, env);
    this.sql = state.storage.sql;
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        quantity_precision INTEGER NOT NULL DEFAULT 0,
        current_stock REAL NOT NULL DEFAULT 0,
        minimum_stock REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        current_stock REAL NOT NULL DEFAULT 0,
        minimum_stock REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        movement_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        stock_before REAL NOT NULL,
        stock_after REAL NOT NULL,
        reason_type TEXT,
        reason_note TEXT,
        reference_type TEXT,
        reference_id TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS boms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        product_id TEXT NOT NULL,
        output_quantity REAL NOT NULL,
        output_unit TEXT NOT NULL,
        selling_price_per_unit REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS bom_materials (
        bom_id TEXT NOT NULL,
        material_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        PRIMARY KEY (bom_id, material_id)
      );
      CREATE TABLE IF NOT EXISTS productions (
        id TEXT PRIMARY KEY,
        bom_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        target_output_quantity REAL NOT NULL,
        actual_output_quantity REAL NOT NULL,
        bom_multiplier REAL NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS production_materials (
        production_id TEXT NOT NULL,
        material_id TEXT NOT NULL,
        calculated_quantity REAL NOT NULL,
        actual_quantity REAL NOT NULL,
        PRIMARY KEY (production_id, material_id)
      );
      CREATE TABLE IF NOT EXISTS stock_opnames (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        system_quantity REAL NOT NULL,
        actual_quantity REAL NOT NULL,
        difference REAL NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        total REAL NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sale_items (
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        PRIMARY KEY (sale_id, product_id)
      );
      CREATE TABLE IF NOT EXISTS ai_insights (
        id TEXT PRIMARY KEY,
        period_from TEXT NOT NULL,
        period_to TEXT NOT NULL,
        data_as_of TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        prompt_version TEXT NOT NULL,
        content_json TEXT NOT NULL,
        model_metadata_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_movements_item ON inventory_movements(item_type, item_id);
      CREATE INDEX IF NOT EXISTS idx_movements_ref ON inventory_movements(reference_type, reference_id);
      CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_productions_product ON productions(product_id);
    `);
  }

  private now(): string {
    return new Date().toISOString();
  }

  private roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  private paginate<T>(items: T[], page: number, limit: number): { data: T[]; meta: { page: number; limit: number; total: number } } {
    const total = items.length;
    const start = (page - 1) * limit;
    const data = items.slice(start, start + limit);
    return { data, meta: { page, limit, total } };
  }

  private itemNotFound(type: string): never {
    throw new Error(`${type.toUpperCase()}_NOT_FOUND`);
  }

  // ==================== MATERIALS ====================

  async listMaterials(page = 1, limit = 20, search?: string): Promise<{ data: Record<string, SqlStorageValue>[]; meta: { page: number; limit: number; total: number } }> {
    let query = 'SELECT * FROM materials';
    const params: SqlStorageValue[] = [];
    if (search) {
      query += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC';
    const items = this.sql.exec(query, ...params).toArray();
    return this.paginate(items, page, limit);
  }

  async createMaterial(name: string, unit: string, quantityPrecision: number, minimumStock: number): Promise<Record<string, SqlStorageValue>> {
    const id = idGenerator.generateId('material');
    const now = this.now();
    this.sql.exec(
      'INSERT INTO materials (id, name, unit, quantity_precision, current_stock, minimum_stock, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)',
      id, name, unit, quantityPrecision, minimumStock, now, now,
    );
    return this.sql.exec('SELECT * FROM materials WHERE id = ?', id).one();
  }

  async getMaterial(id: string): Promise<Record<string, SqlStorageValue>> {
    try {
      return this.sql.exec('SELECT * FROM materials WHERE id = ?', id).one();
    } catch {
      this.itemNotFound('Material');
    }
  }

  async createMaterialMovement(materialId: string, type: string, quantity: number, reasonType?: string, reasonNote?: string): Promise<Record<string, SqlStorageValue>> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const material = await this.getMaterial(materialId);
      const stockBefore = material.current_stock as number;
      let stockAfter: number;

      if (type === 'IN') {
        stockAfter = stockBefore + quantity;
      } else {
        if (quantity > stockBefore) throw new Error('INSUFFICIENT_MATERIAL_STOCK');
        stockAfter = stockBefore - quantity;
      }

      const movementId = idGenerator.generateId('movement');
      const now = this.now();

      this.sql.exec(
        'INSERT INTO inventory_movements (id, item_type, item_id, movement_type, quantity, stock_before, stock_after, reason_type, reason_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        movementId, 'MATERIAL', materialId, type, quantity, stockBefore, stockAfter, reasonType || null, reasonNote || null, now,
      );

      this.sql.exec('UPDATE materials SET current_stock = ?, updated_at = ? WHERE id = ?', stockAfter, now, materialId);

      return {
        movement_id: movementId,
        material_id: materialId,
        type,
        quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
      };
    });
  }

  async listMaterialMovements(materialId: string, page = 1, limit = 50): Promise<{ data: Record<string, SqlStorageValue>[]; meta: { page: number; limit: number; total: number } }> {
    const items = this.sql.exec(
      'SELECT * FROM inventory_movements WHERE item_type = ? AND item_id = ? ORDER BY created_at DESC',
      'MATERIAL', materialId,
    ).toArray();
    return this.paginate(items, page, limit);
  }

  // ==================== PRODUCTS ====================

  async listProducts(page = 1, limit = 20, search?: string): Promise<{ data: Record<string, SqlStorageValue>[]; meta: { page: number; limit: number; total: number } }> {
    let query = 'SELECT p.*, b.selling_price_per_unit FROM products p LEFT JOIN boms b ON p.id = b.product_id';
    const params: SqlStorageValue[] = [];
    if (search) {
      query += ' WHERE p.name LIKE ?';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY p.created_at DESC';
    const items = this.sql.exec(query, ...params).toArray();
    return this.paginate(items, page, limit);
  }

  async createProduct(name: string, unit: string, minimumStock: number): Promise<Record<string, SqlStorageValue>> {
    const id = idGenerator.generateId('product');
    const now = this.now();
    this.sql.exec(
      'INSERT INTO products (id, name, unit, current_stock, minimum_stock, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?)',
      id, name, unit, minimumStock, now, now,
    );
    return this.sql.exec('SELECT * FROM products WHERE id = ?', id).one();
  }

  async getProduct(id: string): Promise<Record<string, SqlStorageValue>> {
    try {
      return this.sql.exec('SELECT * FROM products WHERE id = ?', id).one();
    } catch {
      this.itemNotFound('Product');
    }
  }

  async createProductOutgoing(productId: string, quantity: number, reasonType: string, reasonNote?: string): Promise<Record<string, SqlStorageValue>> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const product = await this.getProduct(productId);
      const stockBefore = product.current_stock as number;
      if (quantity > stockBefore) throw new Error('INSUFFICIENT_PRODUCT_STOCK');
      const stockAfter = stockBefore - quantity;

      const movementId = idGenerator.generateId('movement');
      const now = this.now();

      this.sql.exec(
        'INSERT INTO inventory_movements (id, item_type, item_id, movement_type, quantity, stock_before, stock_after, reason_type, reason_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        movementId, 'PRODUCT', productId, 'OUT', quantity, stockBefore, stockAfter, reasonType, reasonNote || null, now,
      );

      this.sql.exec('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?', stockAfter, now, productId);

      return {
        movement_id: movementId,
        product_id: productId,
        quantity,
        reason_type: reasonType,
        stock_before: stockBefore,
        stock_after: stockAfter,
      };
    });
  }

  async listProductMovements(productId: string, page = 1, limit = 50): Promise<{ data: Record<string, SqlStorageValue>[]; meta: { page: number; limit: number; total: number } }> {
    const items = this.sql.exec(
      'SELECT * FROM inventory_movements WHERE item_type = ? AND item_id = ? ORDER BY created_at DESC',
      'PRODUCT', productId,
    ).toArray();
    return this.paginate(items, page, limit);
  }

  // ==================== BOMs ====================

  async listBoms(page = 1, limit = 20, search?: string): Promise<{ data: Record<string, SqlStorageValue>[]; meta: { page: number; limit: number; total: number } }> {
    let query = 'SELECT * FROM boms';
    const params: SqlStorageValue[] = [];
    if (search) {
      query += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC';
    const items = this.sql.exec(query, ...params).toArray();
    return this.paginate(items, page, limit);
  }

  async getBom(id: string): Promise<Record<string, SqlStorageValue> & { materials: Record<string, SqlStorageValue>[] }> {
    let bom: Record<string, SqlStorageValue>;
    try {
      bom = this.sql.exec('SELECT * FROM boms WHERE id = ?', id).one();
    } catch {
      this.itemNotFound('Bom');
    }
    const materials = this.sql.exec('SELECT * FROM bom_materials WHERE bom_id = ?', id).toArray();
    return { ...bom, materials };
  }

  async createBom(name: string, productId: string, outputQuantity: number, outputUnit: string, sellingPricePerUnit: number, materials: { material_id: string; quantity: number }[]): Promise<Record<string, SqlStorageValue>> {
    const id = idGenerator.generateId('bom');
    const now = this.now();

    this.sql.exec(
      'INSERT INTO boms (id, name, product_id, output_quantity, output_unit, selling_price_per_unit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, name, productId, outputQuantity, outputUnit, sellingPricePerUnit, now, now,
    );

    for (const m of materials) {
      this.sql.exec(
        'INSERT INTO bom_materials (bom_id, material_id, quantity) VALUES (?, ?, ?)',
        id, m.material_id, m.quantity,
      );
    }

    return this.getBom(id);
  }

  async updateBom(id: string, data: { name?: string; output_quantity?: number; selling_price_per_unit?: number; materials?: { material_id: string; quantity: number }[] }): Promise<Record<string, SqlStorageValue>> {
    const now = this.now();
    if (data.name !== undefined) {
      this.sql.exec('UPDATE boms SET name = ?, updated_at = ? WHERE id = ?', data.name, now, id);
    }
    if (data.output_quantity !== undefined) {
      this.sql.exec('UPDATE boms SET output_quantity = ?, updated_at = ? WHERE id = ?', data.output_quantity, now, id);
    }
    if (data.selling_price_per_unit !== undefined) {
      this.sql.exec('UPDATE boms SET selling_price_per_unit = ?, updated_at = ? WHERE id = ?', data.selling_price_per_unit, now, id);
    }
    if (data.materials) {
      this.sql.exec('DELETE FROM bom_materials WHERE bom_id = ?', id);
      for (const m of data.materials) {
        this.sql.exec('INSERT INTO bom_materials (bom_id, material_id, quantity) VALUES (?, ?, ?)', id, m.material_id, m.quantity);
      }
    }
    return this.getBom(id);
  }

  // ==================== PRODUCTIONS ====================

  async previewProduction(productId: string, targetOutputQuantity: number): Promise<Record<string, unknown>> {
    let bom: Record<string, SqlStorageValue>;
    try {
      bom = this.sql.exec('SELECT * FROM boms WHERE product_id = ? ORDER BY created_at DESC', productId).one();
    } catch {
      throw new Error('BOM_NOT_FOUND');
    }
    if (!bom) throw new Error('BOM_NOT_FOUND');

    const bomOutput = bom.output_quantity as number;
    const multiplier = targetOutputQuantity / bomOutput;

    const bomMaterials = this.sql.exec('SELECT * FROM bom_materials WHERE bom_id = ?', bom.id as string).toArray();
    const materials: Record<string, unknown>[] = [];

    for (const bm of bomMaterials) {
      const material = this.sql.exec('SELECT * FROM materials WHERE id = ?', bm.material_id as string).one();
      materials.push({
        material_id: bm.material_id,
        calculated_quantity: this.roundToPrecision((bm.quantity as number) * multiplier, material?.quantity_precision as number || 0),
        unit: material?.unit,
        available_quantity: material?.current_stock,
      });
    }

    const canProduce = materials.every(m => (m.available_quantity as number) >= (m.calculated_quantity as number));
    const errors = canProduce ? [] : ['INSUFFICIENT_MATERIAL_STOCK'];

    return {
      product_id: productId,
      bom_id: bom.id,
      target_output_quantity: targetOutputQuantity,
      bom_output_quantity: bomOutput,
      bom_multiplier: multiplier,
      materials,
      stock_check: { can_produce: canProduce, errors },
    };
  }

  async commitProduction(
    productId: string,
    bomId: string,
    targetOutputQuantity: number,
    actualOutputQuantity: number,
    materialsInput: { material_id: string; calculated_quantity: number; actual_quantity: number }[],
    note?: string,
  ): Promise<Record<string, unknown>> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const now = this.now();

      // Validate all materials have sufficient stock
      for (const m of materialsInput) {
        const material = this.sql.exec('SELECT * FROM materials WHERE id = ?', m.material_id).one();
        if (!material) throw new Error('MATERIAL_NOT_FOUND');
        if (m.actual_quantity > (material.current_stock as number)) throw new Error('INSUFFICIENT_MATERIAL_STOCK');
      }

      const bom = this.sql.exec('SELECT * FROM boms WHERE id = ?', bomId).one();
      if (!bom) throw new Error('BOM_NOT_FOUND');
      if (bom.product_id !== productId) throw new Error('BOM_PRODUCT_MISMATCH');

      const multiplier = targetOutputQuantity / (bom.output_quantity as number);

      const productionId = idGenerator.generateId('production');
      this.sql.exec(
        'INSERT INTO productions (id, bom_id, product_id, target_output_quantity, actual_output_quantity, bom_multiplier, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        productionId, bomId, productId, targetOutputQuantity, actualOutputQuantity, multiplier, note || null, now,
      );

      for (const m of materialsInput) {
        this.sql.exec(
          'INSERT INTO production_materials (production_id, material_id, calculated_quantity, actual_quantity) VALUES (?, ?, ?, ?)',
          productionId, m.material_id, m.calculated_quantity, m.actual_quantity,
        );

        // Consume material stock
        const material = this.sql.exec('SELECT * FROM materials WHERE id = ?', m.material_id).one();
        const stockBefore = material.current_stock as number;
        const stockAfter = stockBefore - m.actual_quantity;

        const movementId = idGenerator.generateId('movement');
        this.sql.exec(
          'INSERT INTO inventory_movements (id, item_type, item_id, movement_type, quantity, stock_before, stock_after, reference_type, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          movementId, 'MATERIAL', m.material_id, 'PRODUCTION_CONSUMPTION', m.actual_quantity, stockBefore, stockAfter, 'PRODUCTION', productionId, now,
        );
        this.sql.exec('UPDATE materials SET current_stock = ?, updated_at = ? WHERE id = ?', stockAfter, now, m.material_id);
      }

      // Add product output stock
      const product = this.sql.exec('SELECT * FROM products WHERE id = ?', productId).one();
      const productStockBefore = product.current_stock as number;
      const productStockAfter = productStockBefore + actualOutputQuantity;

      const productMovementId = idGenerator.generateId('movement');
      this.sql.exec(
        'INSERT INTO inventory_movements (id, item_type, item_id, movement_type, quantity, stock_before, stock_after, reference_type, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        productMovementId, 'PRODUCT', productId, 'PRODUCTION_OUTPUT', actualOutputQuantity, productStockBefore, productStockAfter, 'PRODUCTION', productionId, now,
      );
      this.sql.exec('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?', productStockAfter, now, productId);

      return {
        id: productionId,
        product_id: productId,
        bom_id: bomId,
        target_output_quantity: targetOutputQuantity,
        actual_output_quantity: actualOutputQuantity,
        bom_multiplier: multiplier,
        materials: materialsInput,
        created_at: now,
      };
    });
  }

  async listProductions(page = 1, limit = 20, productId?: string): Promise<{ data: Record<string, SqlStorageValue>[]; meta: { page: number; limit: number; total: number } }> {
    let query = 'SELECT * FROM productions';
    const params: SqlStorageValue[] = [];
    if (productId) {
      query += ' WHERE product_id = ?';
      params.push(productId);
    }
    query += ' ORDER BY created_at DESC';
    const items = this.sql.exec(query, ...params).toArray();
    return this.paginate(items, page, limit);
  }

  async getProduction(id: string): Promise<Record<string, unknown>> {
    let production: Record<string, SqlStorageValue>;
    try {
      production = this.sql.exec('SELECT * FROM productions WHERE id = ?', id).one();
    } catch {
      this.itemNotFound('Production');
    }
    const materials = this.sql.exec('SELECT * FROM production_materials WHERE production_id = ?', id).toArray();
    return { ...production, materials };
  }

  // ==================== STOCK OPNAME ====================

  async createStockOpname(itemType: string, itemId: string, actualQuantity: number, note?: string): Promise<Record<string, unknown>> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const now = this.now();
      let systemQuantity: number;

      if (itemType === 'MATERIAL') {
        const item = this.sql.exec('SELECT * FROM materials WHERE id = ?', itemId).one();
        if (!item) throw new Error('MATERIAL_NOT_FOUND');
        systemQuantity = item.current_stock as number;
      } else {
        const item = this.sql.exec('SELECT * FROM products WHERE id = ?', itemId).one();
        if (!item) throw new Error('PRODUCT_NOT_FOUND');
        systemQuantity = item.current_stock as number;
      }

      const difference = actualQuantity - systemQuantity;
      const opnameId = idGenerator.generateId('stock_opname');

      this.sql.exec(
        'INSERT INTO stock_opnames (id, item_type, item_id, system_quantity, actual_quantity, difference, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        opnameId, itemType, itemId, systemQuantity, actualQuantity, difference, note || null, now,
      );

      // Create inventory movement
      const movementId = idGenerator.generateId('movement');
      this.sql.exec(
        'INSERT INTO inventory_movements (id, item_type, item_id, movement_type, quantity, stock_before, stock_after, reason_type, reference_type, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        movementId, itemType, itemId, 'STOCK_OPNAME', Math.abs(difference), systemQuantity, actualQuantity, 'STOCK_OPNAME', 'STOCK_OPNAME', opnameId, now,
      );

      // Update current stock
      if (itemType === 'MATERIAL') {
        this.sql.exec('UPDATE materials SET current_stock = ?, updated_at = ? WHERE id = ?', actualQuantity, now, itemId);
      } else {
        this.sql.exec('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?', actualQuantity, now, itemId);
      }

      return {
        opname_id: opnameId,
        item_id: itemId,
        system_quantity: systemQuantity,
        actual_quantity: actualQuantity,
        difference,
        stock_after: actualQuantity,
      };
    });
  }

  async listStockOpnames(page = 1, limit = 20): Promise<{ data: Record<string, SqlStorageValue>[]; meta: { page: number; limit: number; total: number } }> {
    const items = this.sql.exec('SELECT * FROM stock_opnames ORDER BY created_at DESC').toArray();
    return this.paginate(items, page, limit);
  }

  // ==================== SALES ====================

  async commitSale(items: { product_id: string; quantity: number }[]): Promise<Record<string, unknown>> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const now = this.now();
      let total = 0;
      const saleItems: Record<string, unknown>[] = [];

      for (const item of items) {
        const product = this.sql.exec('SELECT * FROM products WHERE id = ?', item.product_id).one();
        if (!product) throw new Error('PRODUCT_NOT_FOUND');
        if (item.quantity > (product.current_stock as number)) throw new Error('INSUFFICIENT_PRODUCT_STOCK');

        const bom = this.sql.exec('SELECT * FROM boms WHERE product_id = ? ORDER BY created_at DESC', item.product_id).one();
        const unitPrice = (bom?.selling_price_per_unit as number) || 0;
        const subtotal = unitPrice * item.quantity;
        total += subtotal;

        saleItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal,
        });
      }

      const saleId = idGenerator.generateId('sale');
      this.sql.exec('INSERT INTO sales (id, total, created_at) VALUES (?, ?, ?)', saleId, total, now);

      for (const si of saleItems) {
        const s = si as { product_id: string; quantity: number; unit_price: number; subtotal: number };
        this.sql.exec(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          saleId, s.product_id, s.quantity, s.unit_price, s.subtotal,
        );

        // Reduce product stock
        const product = this.sql.exec('SELECT * FROM products WHERE id = ?', s.product_id).one();
        const stockBefore = product.current_stock as number;
        const stockAfter = stockBefore - s.quantity;

        const movementId = idGenerator.generateId('movement');
        this.sql.exec(
          'INSERT INTO inventory_movements (id, item_type, item_id, movement_type, quantity, stock_before, stock_after, reference_type, reference_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          movementId, 'PRODUCT', s.product_id, 'SALE', s.quantity, stockBefore, stockAfter, 'SALE', saleId, now,
        );
        this.sql.exec('UPDATE products SET current_stock = ?, updated_at = ? WHERE id = ?', stockAfter, now, s.product_id);
      }

      return {
        id: saleId,
        items: saleItems,
        total,
        created_at: now,
      };
    });
  }

  async listSales(page = 1, limit = 20, from?: string, to?: string): Promise<{ data: Record<string, unknown>[]; meta: { page: number; limit: number; total: number } }> {
    let query = 'SELECT * FROM sales';
    const conditions: string[] = [];
    const params: SqlStorageValue[] = [];

    if (from) {
      conditions.push('created_at >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('created_at <= ?');
      params.push(to + 'T23:59:59Z');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const sales = this.sql.exec(query, ...params).toArray();
    const result: Record<string, unknown>[] = [];

    for (const sale of sales) {
      const items = this.sql.exec('SELECT * FROM sale_items WHERE sale_id = ?', sale.id as string).toArray();
      result.push({ ...sale, items });
    }

    return this.paginate(result, page, limit);
  }

  // ==================== DASHBOARD ====================

  async getDashboardSummary(from?: string, to?: string): Promise<Record<string, unknown>> {
    const conditions: string[] = [];
    const params: SqlStorageValue[] = [];

    if (from) {
      conditions.push('created_at >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('created_at <= ?');
      params.push(to + 'T23:59:59Z');
    }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    // Sales summary
    const salesRow = this.sql.exec(`SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM sales${whereClause}`, ...params).one();
    const salesTotal = salesRow.total as number;
    const salesCount = salesRow.count as number;

    // Production summary
    const productionRow = this.sql.exec(`SELECT COUNT(*) as count, COALESCE(SUM(actual_output_quantity), 0) as output FROM productions${whereClause}`, ...params).one();
    const productionCount = productionRow.count as number;
    const productionOutput = productionRow.output as number;

    // Low stock
    const lowMaterialCount = this.sql.exec('SELECT COUNT(*) as count FROM materials WHERE current_stock <= minimum_stock').one().count as number;
    const lowProductCount = this.sql.exec('SELECT COUNT(*) as count FROM products WHERE current_stock <= minimum_stock').one().count as number;

    // Latest activity
    let latest_activity_at = new Date().toISOString();
    try {
      const latestMovement = this.sql.exec('SELECT MAX(created_at) as latest FROM inventory_movements').one();
      if (latestMovement.latest) latest_activity_at = latestMovement.latest as string;
    } catch {
      // inventory_movements table may be empty
    }

    return {
      sales: { total: salesTotal, transaction_count: salesCount },
      production: { production_count: productionCount, output_quantity: productionOutput },
      low_stock: { materials: lowMaterialCount, products: lowProductCount },
      latest_activity_at,
    };
  }

  // ==================== AI INSIGHTS ====================

  async createInsight(periodFrom: string, periodTo: string, content: unknown[], modelMetadata?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const id = idGenerator.generateId('insight');
    const now = this.now();

    // Get latest activity
    let dataAsOf = now;
    try {
      const latestMovement = this.sql.exec('SELECT MAX(created_at) as latest FROM inventory_movements').one();
      if (latestMovement.latest) dataAsOf = latestMovement.latest as string;
    } catch {
      // inventory_movements table may be empty
    }

    this.sql.exec(
      'INSERT INTO ai_insights (id, period_from, period_to, data_as_of, generated_at, prompt_version, content_json, model_metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      id, periodFrom, periodTo, dataAsOf, now, '1.0.0', JSON.stringify(content), JSON.stringify(modelMetadata || {}),
    );

    return { id, generated_at: now, data_as_of: dataAsOf, content };
  }

  async listInsights(limit = 10): Promise<{ data: Record<string, unknown>[]; meta: Record<string, unknown> }> {
    const insights = this.sql.exec('SELECT * FROM ai_insights ORDER BY generated_at DESC LIMIT ?', limit).toArray();
    let latestActivityAt: string | null = null;
    try {
      const latestMovement = this.sql.exec('SELECT MAX(created_at) as latest FROM inventory_movements').one();
      latestActivityAt = latestMovement.latest as string | null;
    } catch {
      // inventory_movements table may be empty
    }

    const data = insights.map(insight => {
      const generatedAt = insight.generated_at as string;
      const isStale = latestActivityAt ? latestActivityAt > generatedAt : false;
      return {
        ...insight,
        content: JSON.parse(insight.content_json as string),
        is_stale: isStale,
      };
    });

    return { data, meta: { latest_business_activity_at: latestActivityAt } };
  }

  // ==================== ANALYTICS ====================

  async getLatestActivityAt(): Promise<string | null> {
    try {
      const row = this.sql.exec('SELECT MAX(created_at) as latest FROM inventory_movements').one();
      return (row.latest as string) || null;
    } catch {
      return null;
    }
  }

  async getSalesMetrics(from?: string, to?: string): Promise<Record<string, unknown>> {
    const conditions: string[] = [];
    const params: SqlStorageValue[] = [];
    if (from) { conditions.push('created_at >= ?'); params.push(from); }
    if (to) { conditions.push('created_at <= ?'); params.push(to + 'T23:59:59Z'); }
    const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    const row = this.sql.exec(`SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM sales${where}`, ...params).one();
    return { total: row.total, transaction_count: row.count };
  }

  async getTopProducts(limit = 5): Promise<Record<string, unknown>[]> {
    return this.sql.exec(
      'SELECT product_id, SUM(quantity) as total_quantity, SUM(subtotal) as total_revenue FROM sale_items GROUP BY product_id ORDER BY total_revenue DESC LIMIT ?',
      limit,
    ).toArray();
  }

  async getProductionVariance(): Promise<Record<string, unknown>[]> {
    return this.sql.exec(`
      SELECT pm.material_id, m.name as material_name,
        AVG(pm.calculated_quantity) as calculated_average,
        AVG(pm.actual_quantity) as actual_average
      FROM production_materials pm
      JOIN materials m ON pm.material_id = m.id
      GROUP BY pm.material_id
    `).toArray();
  }

  async seed(force = false): Promise<{ seeded: boolean; message: string; counts: Record<string, number> }> {
    const existing = this.sql.exec('SELECT COUNT(*) as count FROM materials').one();
    const materialCount = Number(existing.count);
    if (materialCount > 0 && !force) {
      return { seeded: false, message: 'Tenant database already seeded', counts: { materials: materialCount } };
    }

    if (force) {
      this.sql.exec('DELETE FROM production_materials');
      this.sql.exec('DELETE FROM bom_materials');
      this.sql.exec('DELETE FROM sale_items');
      this.sql.exec('DELETE FROM productions');
      this.sql.exec('DELETE FROM sales');
      this.sql.exec('DELETE FROM boms');
      this.sql.exec('DELETE FROM inventory_movements');
      this.sql.exec('DELETE FROM ai_insights');
      this.sql.exec('DELETE FROM products');
      this.sql.exec('DELETE FROM materials');
    }

    const statements = getTenantSeedSQL();
    for (const sql of statements) {
      this.sql.exec(sql);
    }

    const materials = Number(this.sql.exec('SELECT COUNT(*) as count FROM materials').one().count);
    const products = Number(this.sql.exec('SELECT COUNT(*) as count FROM products').one().count);
    const boms = Number(this.sql.exec('SELECT COUNT(*) as count FROM boms').one().count);
    const productions = Number(this.sql.exec('SELECT COUNT(*) as count FROM productions').one().count);
    const sales = Number(this.sql.exec('SELECT COUNT(*) as count FROM sales').one().count);
    const insights = Number(this.sql.exec('SELECT COUNT(*) as count FROM ai_insights').one().count);

    return {
      seeded: true,
      message: 'Tenant seed data inserted successfully',
      counts: { materials, products, boms, productions, sales, ai_insights: insights },
    };
  }
}
