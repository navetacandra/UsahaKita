import {
  User,
  Business,
  Material,
  Product,
  StockMovement,
  StockOpnameRecord,
  Bom,
  ProductionPreview,
  ProductionRecord,
  Sale,
  DashboardSummary,
  Insight,
  ApiResponse,
} from '../types';

const STORAGE_KEY = 'usahakita_store_v1';

interface StorageSchema {
  user: User | null;
  business: Business;
  materials: Material[];
  products: Product[];
  movements: StockMovement[];
  stockOpnames: StockOpnameRecord[];
  boms: Bom[];
  productions: ProductionRecord[];
  sales: Sale[];
  insights: Insight[];
  latestBusinessActivityAt: string;
}

const DEFAULT_DATA: StorageSchema = {
  user: {
    id: 'usr_01',
    email: 'owner@tokomaju.com',
  },
  business: {
    id: 'ten_01',
    name: 'Toko Maju',
    description: 'Usaha produksi dan penjualan makanan rumahan',
  },
  materials: [
    {
      id: 'mat_01',
      name: 'Tepung Terigu',
      unit: 'kg',
      quantity_precision: 2,
      current_stock: 12.5,
      minimum_stock: 5,
    },
    {
      id: 'mat_02',
      name: 'Telur Ayam',
      unit: 'pcs',
      quantity_precision: 0,
      current_stock: 24,
      minimum_stock: 20,
    },
    {
      id: 'mat_03',
      name: 'Gula Pasir',
      unit: 'kg',
      quantity_precision: 2,
      current_stock: 4.5,
      minimum_stock: 2,
    },
    {
      id: 'mat_04',
      name: 'Minyak Goreng',
      unit: 'liter',
      quantity_precision: 1,
      current_stock: 6,
      minimum_stock: 3,
    },
    {
      id: 'mat_05',
      name: 'Coklat Batang',
      unit: 'kg',
      quantity_precision: 2,
      current_stock: 1.2,
      minimum_stock: 2,
    },
  ],
  products: [
    {
      id: 'prd_01',
      name: 'Donat Coklat',
      unit: 'pcs',
      current_stock: 35,
      minimum_stock: 20,
      selling_price: 5000,
    },
    {
      id: 'prd_02',
      name: 'Roti Manis Keju',
      unit: 'pcs',
      current_stock: 15,
      minimum_stock: 15,
      selling_price: 6000,
    },
  ],
  movements: [
    {
      movement_id: 'mov_01',
      item_type: 'MATERIAL',
      item_id: 'mat_01',
      item_name: 'Tepung Terigu',
      unit: 'kg',
      type: 'IN',
      quantity: 10,
      stock_before: 2.5,
      stock_after: 12.5,
      reason: 'Pembelian bahan baku mingguan',
      timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    },
    {
      movement_id: 'mov_02',
      item_type: 'PRODUCT',
      item_id: 'prd_01',
      item_name: 'Donat Coklat',
      unit: 'pcs',
      type: 'SALE',
      quantity: 5,
      stock_before: 40,
      stock_after: 35,
      reason: 'Penjualan kasir #TRX-8821',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
  stockOpnames: [],
  boms: [
    {
      id: 'bom_01',
      name: 'Resep Donat Coklat',
      product_id: 'prd_01',
      product_name: 'Donat Coklat',
      output_quantity: 20,
      output_unit: 'pcs',
      selling_price_per_unit: 5000,
      materials: [
        {
          material_id: 'mat_01',
          material_name: 'Tepung Terigu',
          unit: 'kg',
          quantity: 1,
        },
        {
          material_id: 'mat_03',
          material_name: 'Gula Pasir',
          unit: 'kg',
          quantity: 0.3,
        },
        {
          material_id: 'mat_02',
          material_name: 'Telur Ayam',
          unit: 'pcs',
          quantity: 10,
        },
        {
          material_id: 'mat_05',
          material_name: 'Coklat Batang',
          unit: 'kg',
          quantity: 0.4,
        },
      ],
      created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    },
  ],
  productions: [
    {
      id: 'prod_01',
      product_id: 'prd_01',
      product_name: 'Donat Coklat',
      bom_id: 'bom_01',
      target_output_quantity: 20,
      actual_output_quantity: 20,
      bom_multiplier: 1.0,
      materials: [
        {
          material_id: 'mat_01',
          material_name: 'Tepung Terigu',
          calculated_quantity: 1,
          actual_quantity: 1,
          unit: 'kg',
        },
        {
          material_id: 'mat_03',
          material_name: 'Gula Pasir',
          calculated_quantity: 0.3,
          actual_quantity: 0.3,
          unit: 'kg',
        },
        {
          material_id: 'mat_02',
          material_name: 'Telur Ayam',
          calculated_quantity: 10,
          actual_quantity: 10,
          unit: 'pcs',
        },
      ],
      note: 'Produksi batch pagi lancar',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ],
  sales: [
    {
      id: 'sale_01',
      items: [
        {
          product_id: 'prd_01',
          product_name: 'Donat Coklat',
          quantity: 5,
          unit_price: 5000,
          subtotal: 25000,
        },
      ],
      total: 25000,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
  insights: [],
  latestBusinessActivityAt: new Date().toISOString(),
};

function getStore(): StorageSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return DEFAULT_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading localStorage store, resetting to default', err);
    return DEFAULT_DATA;
  }
}

function saveStore(store: StorageSchema) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Error saving store to localStorage', err);
  }
}

function touchActivity(store: StorageSchema) {
  store.latestBusinessActivityAt = new Date().toISOString();
}

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

// API Client implementing frontend-plan.json
export const api = {
  // Auth
  auth: {
    async me(): Promise<ApiResponse<{ user: User; business: Business }>> {
      await delay(60);
      const store = getStore();
      if (!store.user) {
        return {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Sesi telah berakhir, silakan masuk kembali.' },
        };
      }
      return {
        success: true,
        data: {
          user: store.user,
          business: store.business,
        },
      };
    },

    async login(email: string, _pass: string): Promise<ApiResponse<{ user: User; business: Business }>> {
      await delay(150);
      if (!email.trim()) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email tidak boleh kosong.', fields: { email: 'Harus diisi' } },
        };
      }
      const store = getStore();
      store.user = {
        id: 'usr_' + Date.now().toString(36),
        email,
      };
      saveStore(store);
      return {
        success: true,
        data: {
          user: store.user,
          business: store.business,
        },
      };
    },

    async register(
      email: string,
      _pass: string,
      business_name: string,
      business_description?: string
    ): Promise<ApiResponse<{ user: User; business: Business }>> {
      await delay(180);
      if (!email.trim() || !business_name.trim()) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email dan Nama Usaha wajib diisi.',
            fields: {
              ...(!email.trim() ? { email: 'Wajib diisi' } : {}),
              ...(!business_name.trim() ? { business_name: 'Wajib diisi' } : {}),
            },
          },
        };
      }

      const store = getStore();
      const newUser: User = { id: 'usr_' + Date.now().toString(36), email };
      const newBusiness: Business = {
        id: 'ten_' + Date.now().toString(36),
        name: business_name,
        description: business_description || '',
      };
      store.user = newUser;
      store.business = newBusiness;
      touchActivity(store);
      saveStore(store);

      return {
        success: true,
        data: {
          user: newUser,
          business: newBusiness,
        },
      };
    },

    async logout(): Promise<ApiResponse<null>> {
      await delay(60);
      const store = getStore();
      store.user = null;
      saveStore(store);
      return { success: true };
    },
  },

  // Business profile
  business: {
    async update(name: string, description?: string): Promise<ApiResponse<Business>> {
      await delay(100);
      const store = getStore();
      store.business.name = name.trim() || store.business.name;
      store.business.description = description;
      touchActivity(store);
      saveStore(store);
      return {
        success: true,
        data: store.business,
      };
    },
  },

  // Materials
  materials: {
    async list(query?: { search?: string }): Promise<ApiResponse<Material[]>> {
      await delay(80);
      const store = getStore();
      let list = [...store.materials];
      if (query?.search) {
        const s = query.search.toLowerCase();
        list = list.filter((m) => m.name.toLowerCase().includes(s));
      }
      return {
        success: true,
        data: list,
        meta: { total: list.length },
      };
    },

    async create(data: {
      name: string;
      unit: string;
      quantity_precision?: number;
      minimum_stock?: number;
      initial_stock?: number;
    }): Promise<ApiResponse<Material>> {
      await delay(100);
      const store = getStore();
      const newMat: Material = {
        id: 'mat_' + Date.now().toString(36),
        name: data.name.trim(),
        unit: data.unit.trim(),
        quantity_precision: data.quantity_precision ?? 2,
        current_stock: data.initial_stock ?? 0,
        minimum_stock: data.minimum_stock ?? 0,
      };
      store.materials.unshift(newMat);

      if (data.initial_stock && data.initial_stock > 0) {
        store.movements.unshift({
          movement_id: 'mov_' + Date.now().toString(36),
          item_type: 'MATERIAL',
          item_id: newMat.id,
          item_name: newMat.name,
          unit: newMat.unit,
          type: 'IN',
          quantity: data.initial_stock,
          stock_before: 0,
          stock_after: data.initial_stock,
          reason: 'Stok awal material baru',
          timestamp: new Date().toISOString(),
        });
      }

      touchActivity(store);
      saveStore(store);
      return { success: true, data: newMat };
    },

    async update(id: string, data: Partial<Material>): Promise<ApiResponse<Material>> {
      await delay(100);
      const store = getStore();
      const idx = store.materials.findIndex((m) => m.id === id);
      if (idx === -1) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Material tidak ditemukan' } };
      }
      store.materials[idx] = { ...store.materials[idx], ...data };
      touchActivity(store);
      saveStore(store);
      return { success: true, data: store.materials[idx] };
    },

    async addMovement(
      id: string,
      type: 'IN' | 'OUT',
      quantity: number,
      reason?: string
    ): Promise<ApiResponse<{ movement_id: string; material_id: string; stock_before: number; stock_after: number }>> {
      await delay(100);
      const store = getStore();
      const mat = store.materials.find((m) => m.id === id);
      if (!mat) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Material tidak ditemukan' } };
      }
      if (type === 'OUT' && mat.current_stock < quantity) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Stok ${mat.name} tidak mencukupi (Tersedia: ${mat.current_stock} ${mat.unit}).`,
          },
        };
      }

      const before = mat.current_stock;
      const after = type === 'IN' ? before + quantity : before - quantity;
      mat.current_stock = Number(after.toFixed(mat.quantity_precision));

      const movId = 'mov_' + Date.now().toString(36);
      store.movements.unshift({
        movement_id: movId,
        item_type: 'MATERIAL',
        item_id: mat.id,
        item_name: mat.name,
        unit: mat.unit,
        type,
        quantity,
        stock_before: before,
        stock_after: mat.current_stock,
        reason: reason || (type === 'IN' ? 'Penerimaan stok bahan' : 'Pemakaian / susut bahan'),
        timestamp: new Date().toISOString(),
      });

      touchActivity(store);
      saveStore(store);

      return {
        success: true,
        data: {
          movement_id: movId,
          material_id: mat.id,
          stock_before: before,
          stock_after: mat.current_stock,
        },
      };
    },
  },

  // Products
  products: {
    async list(query?: { search?: string }): Promise<ApiResponse<Product[]>> {
      await delay(80);
      const store = getStore();
      let list = [...store.products];
      if (query?.search) {
        const s = query.search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(s));
      }
      return { success: true, data: list, meta: { total: list.length } };
    },

    async create(data: {
      name: string;
      unit: string;
      minimum_stock?: number;
      selling_price?: number;
    }): Promise<ApiResponse<Product>> {
      await delay(100);
      const store = getStore();
      const newProd: Product = {
        id: 'prd_' + Date.now().toString(36),
        name: data.name.trim(),
        unit: data.unit.trim(),
        current_stock: 0, // In compliance with rule: products start at 0, only increased by production!
        minimum_stock: data.minimum_stock ?? 10,
        selling_price: data.selling_price ?? 0,
      };
      store.products.unshift(newProd);
      touchActivity(store);
      saveStore(store);
      return { success: true, data: newProd };
    },

    async update(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
      await delay(100);
      const store = getStore();
      const idx = store.products.findIndex((p) => p.id === id);
      if (idx === -1) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' } };
      }
      store.products[idx] = { ...store.products[idx], ...data };
      touchActivity(store);
      saveStore(store);
      return { success: true, data: store.products[idx] };
    },

    async recordOutgoing(
      id: string,
      quantity: number,
      reason_type: 'DAMAGED' | 'EXPIRED' | 'SAMPLE' | 'OTHER',
      reason_note?: string
    ): Promise<ApiResponse<{ movement_id: string; product_id: string; stock_before: number; stock_after: number }>> {
      await delay(100);
      const store = getStore();
      const prod = store.products.find((p) => p.id === id);
      if (!prod) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' } };
      }
      if (prod.current_stock < quantity) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Stok ${prod.name} tidak cukup (Sisa: ${prod.current_stock} ${prod.unit}).`,
          },
        };
      }

      const before = prod.current_stock;
      prod.current_stock = before - quantity;
      const movId = 'mov_' + Date.now().toString(36);

      store.movements.unshift({
        movement_id: movId,
        item_type: 'PRODUCT',
        item_id: prod.id,
        item_name: prod.name,
        unit: prod.unit,
        type: 'OUT',
        quantity,
        stock_before: before,
        stock_after: prod.current_stock,
        reason: `Pengeluaran non-penjualan [${reason_type}]: ${reason_note || 'Barang afkir/sampel'}`,
        timestamp: new Date().toISOString(),
      });

      touchActivity(store);
      saveStore(store);

      return {
        success: true,
        data: {
          movement_id: movId,
          product_id: prod.id,
          stock_before: before,
          stock_after: prod.current_stock,
        },
      };
    },
  },

  // Stock Opname
  stockOpname: {
    async create(data: {
      item_type: 'MATERIAL' | 'PRODUCT';
      item_id: string;
      actual_quantity: number;
      note?: string;
    }): Promise<ApiResponse<StockOpnameRecord>> {
      await delay(120);
      const store = getStore();
      let itemName = '';
      let unit = '';
      let systemQty = 0;

      if (data.item_type === 'MATERIAL') {
        const mat = store.materials.find((m) => m.id === data.item_id);
        if (!mat) {
          return { success: false, error: { code: 'NOT_FOUND', message: 'Material tidak ditemukan' } };
        }
        itemName = mat.name;
        unit = mat.unit;
        systemQty = mat.current_stock;
        mat.current_stock = data.actual_quantity;
      } else {
        const prod = store.products.find((p) => p.id === data.item_id);
        if (!prod) {
          return { success: false, error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' } };
        }
        itemName = prod.name;
        unit = prod.unit;
        systemQty = prod.current_stock;
        prod.current_stock = data.actual_quantity;
      }

      const diff = Number((data.actual_quantity - systemQty).toFixed(3));
      const opnameRecord: StockOpnameRecord = {
        opname_id: 'opn_' + Date.now().toString(36),
        item_type: data.item_type,
        item_id: data.item_id,
        item_name: itemName,
        unit,
        system_quantity: systemQty,
        actual_quantity: data.actual_quantity,
        difference: diff,
        stock_after: data.actual_quantity,
        note: data.note || 'Pencocokan stok fisik',
        created_at: new Date().toISOString(),
      };

      store.stockOpnames.unshift(opnameRecord);
      store.movements.unshift({
        movement_id: 'mov_' + Date.now().toString(36),
        item_type: data.item_type,
        item_id: data.item_id,
        item_name: itemName,
        unit,
        type: 'OPNAME',
        quantity: Math.abs(diff),
        stock_before: systemQty,
        stock_after: data.actual_quantity,
        reason: `Stok opname (Selisih: ${diff > 0 ? '+' : ''}${diff} ${unit}): ${data.note || 'Penyesuaian fisik'}`,
        timestamp: new Date().toISOString(),
      });

      touchActivity(store);
      saveStore(store);

      return { success: true, data: opnameRecord };
    },

    async list(): Promise<ApiResponse<StockOpnameRecord[]>> {
      await delay(80);
      const store = getStore();
      return { success: true, data: store.stockOpnames };
    },
  },

  // Stock movements
  movements: {
    async list(itemType?: 'MATERIAL' | 'PRODUCT'): Promise<ApiResponse<StockMovement[]>> {
      await delay(80);
      const store = getStore();
      let list = [...store.movements];
      if (itemType) {
        list = list.filter((m) => m.item_type === itemType);
      }
      return { success: true, data: list };
    },
  },

  // BoM (Resep & Komposisi)
  boms: {
    async list(): Promise<ApiResponse<Bom[]>> {
      await delay(80);
      const store = getStore();
      return { success: true, data: store.boms };
    },

    async getById(id: string): Promise<ApiResponse<Bom>> {
      await delay(60);
      const store = getStore();
      const bom = store.boms.find((b) => b.id === id);
      if (!bom) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Resep tidak ditemukan' } };
      }
      return { success: true, data: bom };
    },

    async create(data: {
      name: string;
      product_id: string;
      output_quantity: number;
      output_unit: string;
      selling_price_per_unit: number;
      materials: Array<{ material_id: string; quantity: number }>;
    }): Promise<ApiResponse<Bom>> {
      await delay(120);
      const store = getStore();
      const prod = store.products.find((p) => p.id === data.product_id);
      if (!prod) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Produk hasil tidak ditemukan' } };
      }

      // Update product selling price if specified
      if (data.selling_price_per_unit > 0) {
        prod.selling_price = data.selling_price_per_unit;
      }

      const enrichedMaterials = data.materials.map((m) => {
        const mat = store.materials.find((item) => item.id === m.material_id);
        return {
          material_id: m.material_id,
          material_name: mat ? mat.name : 'Bahan',
          unit: mat ? mat.unit : 'pcs',
          quantity: m.quantity,
        };
      });

      const newBom: Bom = {
        id: 'bom_' + Date.now().toString(36),
        name: data.name.trim(),
        product_id: data.product_id,
        product_name: prod.name,
        output_quantity: data.output_quantity,
        output_unit: data.output_unit,
        selling_price_per_unit: data.selling_price_per_unit,
        materials: enrichedMaterials,
        created_at: new Date().toISOString(),
      };

      store.boms.unshift(newBom);
      touchActivity(store);
      saveStore(store);

      return { success: true, data: newBom };
    },
  },

  // Production
  productions: {
    async list(): Promise<ApiResponse<ProductionRecord[]>> {
      await delay(80);
      const store = getStore();
      return { success: true, data: store.productions };
    },

    async getById(id: string): Promise<ApiResponse<ProductionRecord>> {
      await delay(60);
      const store = getStore();
      const prod = store.productions.find((p) => p.id === id);
      if (!prod) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Catatan produksi tidak ditemukan' } };
      }
      return { success: true, data: prod };
    },

    async preview(product_id: string, target_output_quantity: number): Promise<ApiResponse<ProductionPreview>> {
      await delay(100);
      const store = getStore();
      const prod = store.products.find((p) => p.id === product_id);
      if (!prod) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' } };
      }

      // Find active BoM for this product
      const bom = store.boms.find((b) => b.product_id === product_id);
      if (!bom) {
        return {
          success: false,
          error: {
            code: 'NO_BOM',
            message: `Produk "${prod.name}" belum memiliki Resep & Komposisi (BoM). Buat resep terlebih dahulu di menu Resep.`,
          },
        };
      }

      const multiplier = target_output_quantity / bom.output_quantity;
      const errors: string[] = [];

      const materials: ProductionPreview['materials'] = bom.materials.map((m) => {
        const mat = store.materials.find((item) => item.id === m.material_id);
        const available = mat ? mat.current_stock : 0;
        const precision = mat?.quantity_precision ?? 2;
        const calculated = Number((m.quantity * multiplier).toFixed(precision));

        if (available < calculated) {
          errors.push(
            `Stok ${mat?.name || m.material_id} kurang (Dibutuhkan: ${calculated} ${mat?.unit || ''}, Tersedia: ${available} ${mat?.unit || ''})`
          );
        }

        return {
          material_id: m.material_id,
          material_name: mat ? mat.name : 'Bahan',
          calculated_quantity: calculated,
          unit: mat ? mat.unit : 'pcs',
          available_quantity: available,
          quantity_precision: precision,
        };
      });

      return {
        success: true,
        data: {
          product_id,
          product_name: prod.name,
          bom_id: bom.id,
          bom_name: bom.name,
          target_output_quantity,
          bom_output_quantity: bom.output_quantity,
          bom_multiplier: Number(multiplier.toFixed(4)),
          materials,
          stock_check: {
            can_produce: errors.length === 0,
            errors,
          },
        },
      };
    },

    async create(data: {
      product_id: string;
      target_output_quantity: number;
      actual_output_quantity: number;
      bom_id: string;
      materials: Array<{
        material_id: string;
        calculated_quantity: number;
        actual_quantity: number;
      }>;
      note?: string;
    }): Promise<ApiResponse<ProductionRecord>> {
      await delay(150);
      const store = getStore();
      const prod = store.products.find((p) => p.id === data.product_id);
      if (!prod) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' } };
      }

      // Check all actual materials against current stock
      for (const reqMat of data.materials) {
        const mat = store.materials.find((m) => m.id === reqMat.material_id);
        if (!mat) {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: `Material ${reqMat.material_id} tidak ditemukan` },
          };
        }
        if (mat.current_stock < reqMat.actual_quantity) {
          return {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Gagal memproses: Stok ${mat.name} tidak cukup untuk penggunaan aktual ${reqMat.actual_quantity} ${mat.unit} (Sisa: ${mat.current_stock} ${mat.unit}).`,
            },
          };
        }
      }

      // Deduct materials using actual_quantity
      const enrichedMaterials: ProductionRecord['materials'] = [];
      const prodId = 'prod_' + Date.now().toString(36);

      for (const reqMat of data.materials) {
        const mat = store.materials.find((m) => m.id === reqMat.material_id)!;
        const before = mat.current_stock;
        mat.current_stock = Number((before - reqMat.actual_quantity).toFixed(mat.quantity_precision));

        store.movements.unshift({
          movement_id: 'mov_' + Date.now().toString(36) + '_' + mat.id.slice(-4),
          item_type: 'MATERIAL',
          item_id: mat.id,
          item_name: mat.name,
          unit: mat.unit,
          type: 'PRODUCTION_CONSUME',
          quantity: reqMat.actual_quantity,
          stock_before: before,
          stock_after: mat.current_stock,
          reason: `Konsumsi produksi #${prodId.slice(-6)} untuk ${prod.name}`,
          timestamp: new Date().toISOString(),
        });

        enrichedMaterials.push({
          material_id: mat.id,
          material_name: mat.name,
          calculated_quantity: reqMat.calculated_quantity,
          actual_quantity: reqMat.actual_quantity,
          unit: mat.unit,
        });
      }

      // Increase product stock using actual_output_quantity
      const prodBefore = prod.current_stock;
      prod.current_stock = prodBefore + data.actual_output_quantity;

      store.movements.unshift({
        movement_id: 'mov_' + Date.now().toString(36) + '_out',
        item_type: 'PRODUCT',
        item_id: prod.id,
        item_name: prod.name,
        unit: prod.unit,
        type: 'PRODUCTION_OUTPUT',
        quantity: data.actual_output_quantity,
        stock_before: prodBefore,
        stock_after: prod.current_stock,
        reason: `Hasil produksi #${prodId.slice(-6)}`,
        timestamp: new Date().toISOString(),
      });

      const bom = store.boms.find((b) => b.id === data.bom_id);
      const multiplier = bom ? data.target_output_quantity / bom.output_quantity : 1;

      const record: ProductionRecord = {
        id: prodId,
        product_id: prod.id,
        product_name: prod.name,
        bom_id: data.bom_id,
        target_output_quantity: data.target_output_quantity,
        actual_output_quantity: data.actual_output_quantity,
        bom_multiplier: Number(multiplier.toFixed(4)),
        materials: enrichedMaterials,
        note: data.note,
        created_at: new Date().toISOString(),
      };

      store.productions.unshift(record);
      touchActivity(store);
      saveStore(store);

      return { success: true, data: record };
    },
  },

  // POS & Sales
  sales: {
    async list(): Promise<ApiResponse<Sale[]>> {
      await delay(80);
      const store = getStore();
      return { success: true, data: store.sales };
    },

    async create(items: Array<{ product_id: string; quantity: number }>): Promise<ApiResponse<Sale>> {
      await delay(120);
      const store = getStore();
      if (!items.length) {
        return { success: false, error: { code: 'EMPTY_CART', message: 'Keranjang belanja kosong.' } };
      }

      // Validate stock availability
      for (const item of items) {
        const prod = store.products.find((p) => p.id === item.product_id);
        if (!prod) {
          return { success: false, error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' } };
        }
        if (prod.current_stock < item.quantity) {
          return {
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Stok ${prod.name} tidak mencukupi (Tersedia: ${prod.current_stock} ${prod.unit}).`,
            },
          };
        }
      }

      const saleId = 'sale_' + Date.now().toString(36);
      const saleItems: Sale['items'] = [];
      let total = 0;

      for (const item of items) {
        const prod = store.products.find((p) => p.id === item.product_id)!;
        const before = prod.current_stock;
        prod.current_stock = before - item.quantity;
        const subtotal = prod.selling_price * item.quantity;
        total += subtotal;

        saleItems.push({
          product_id: prod.id,
          product_name: prod.name,
          quantity: item.quantity,
          unit_price: prod.selling_price,
          subtotal,
        });

        store.movements.unshift({
          movement_id: 'mov_' + Date.now().toString(36) + '_' + prod.id.slice(-4),
          item_type: 'PRODUCT',
          item_id: prod.id,
          item_name: prod.name,
          unit: prod.unit,
          type: 'SALE',
          quantity: item.quantity,
          stock_before: before,
          stock_after: prod.current_stock,
          reason: `Penjualan POS #${saleId.slice(-6)}`,
          timestamp: new Date().toISOString(),
        });
      }

      const saleRecord: Sale = {
        id: saleId,
        items: saleItems,
        total,
        created_at: new Date().toISOString(),
      };

      store.sales.unshift(saleRecord);
      touchActivity(store);
      saveStore(store);

      return { success: true, data: saleRecord };
    },
  },

  // Dashboard summary
  dashboard: {
    async getSummary(): Promise<ApiResponse<DashboardSummary>> {
      await delay(90);
      const store = getStore();

      const totalSales = store.sales.reduce((acc, s) => acc + s.total, 0);
      const totalProductionOutput = store.productions.reduce((acc, p) => acc + p.actual_output_quantity, 0);

      const lowMaterials = store.materials.filter((m) => m.current_stock <= m.minimum_stock).length;
      const lowProducts = store.products.filter((p) => p.current_stock <= p.minimum_stock).length;

      return {
        success: true,
        data: {
          sales: {
            total: totalSales,
            transaction_count: store.sales.length,
          },
          production: {
            production_count: store.productions.length,
            output_quantity: totalProductionOutput,
          },
          low_stock: {
            materials: lowMaterials,
            products: lowProducts,
          },
          latest_activity_at: store.latestBusinessActivityAt,
        },
      };
    },
  },

  // AI Insights
  insights: {
    async list(): Promise<ApiResponse<Insight[]>> {
      await delay(80);
      const store = getStore();
      const latestActivityTime = new Date(store.latestBusinessActivityAt).getTime();

      // Check staleness according to plan: latest_business_activity_at > generated_at
      const list = store.insights.map((ins) => {
        const generatedTime = new Date(ins.generated_at).getTime();
        return {
          ...ins,
          is_stale: latestActivityTime > generatedTime,
        };
      });

      return {
        success: true,
        data: list,
        meta: {
          latest_business_activity_at: store.latestBusinessActivityAt,
        },
      };
    },

    async generate(): Promise<ApiResponse<Insight>> {
      await delay(500); // Simulate analytical thinking
      const store = getStore();
      const now = new Date();
      const dataAsOf = new Date(now.getTime() - 1000 * 30).toISOString();

      const lowMats = store.materials.filter((m) => m.current_stock <= m.minimum_stock);
      const lowProds = store.products.filter((p) => p.current_stock <= p.minimum_stock);
      const totalSales = store.sales.reduce((acc, s) => acc + s.total, 0);

      const items: Insight['content'] = [];

      if (lowMats.length > 0) {
        const names = lowMats.map((m) => `${m.name} (${m.current_stock} ${m.unit})`).join(', ');
        items.push({
          type: 'WARNING',
          title: `${lowMats.length} Bahan baku mendekati batas minimum`,
          body: `Perhatian segera untuk bahan: ${names}. Rencanakan pembelian stok masuk sebelum jadwal produksi berikutnya terhambat.`,
        });
      } else {
        items.push({
          type: 'TIP',
          title: 'Stok bahan baku terpantau aman',
          body: 'Seluruh material berada di atas batas minimum stok. Pertahankan kuota cadangan ini.',
        });
      }

      if (lowProds.length > 0) {
        items.push({
          type: 'WARNING',
          title: `Stok ${lowProds[0].name} tersisa sedikit`,
          body: `Stok ${lowProds[0].name} tersisa ${lowProds[0].current_stock} ${lowProds[0].unit}. Disarankan membuat batch produksi baru via menu Produksi.`,
        });
      }

      if (store.sales.length > 0) {
        items.push({
          type: 'OPPORTUNITY',
          title: 'Aktivitas penjualan mencatatkan hasil positif',
          body: `Total omset tercatat ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalSales)} dari ${store.sales.length} transaksi. Pastikan ketersediaan stok produk terlaris tetap terjaga.`,
        });
      }

      items.push({
        type: 'TIP',
        title: 'Optimasi Resep & BoM Multiplier',
        body: 'Gunakan fitur penyesuaian produksi terukur (misal pembulatan butir telur atau porsi pecahan) agar kalkulasi biaya bahan riil tetap akurat.',
      });

      const newInsight: Insight = {
        id: 'ins_' + Date.now().toString(36),
        generated_at: now.toISOString(),
        data_as_of: dataAsOf,
        is_stale: false,
        content: items,
      };

      store.insights.unshift(newInsight);
      saveStore(store);

      return { success: true, data: newInsight };
    },
  },

  // Reset store helper for test/e2e convenience
  devReset: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    window.location.reload();
  },
};
