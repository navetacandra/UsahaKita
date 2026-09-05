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

const API_BASE = '/api/v1';
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
    id: 'usr_db58adde21ed6288',
    email: 'demo@usahakita.com',
  },
  business: {
    id: 'ten_c03bde3ef562da40',
    name: 'Toko Maju Bersama',
    description: 'Produksi roti dan aneka olahan kue',
  },
  materials: [
    { id: 'mat_01', name: 'Tepung Terigu', unit: 'kg', quantity_precision: 2, current_stock: 12.5, minimum_stock: 5 },
    { id: 'mat_02', name: 'Telur Ayam', unit: 'pcs', quantity_precision: 0, current_stock: 45, minimum_stock: 20 },
    { id: 'mat_03', name: 'Gula Pasir', unit: 'kg', quantity_precision: 2, current_stock: 4.5, minimum_stock: 2 },
    { id: 'mat_04', name: 'Minyak Goreng', unit: 'liter', quantity_precision: 1, current_stock: 6, minimum_stock: 3 },
    { id: 'mat_05', name: 'Coklat Batang', unit: 'kg', quantity_precision: 2, current_stock: 1.2, minimum_stock: 2 },
  ],
  products: [
    { id: 'prd_01', name: 'Donat Coklat', unit: 'pcs', current_stock: 35, minimum_stock: 20, selling_price: 5000 },
    { id: 'prd_02', name: 'Roti Manis Keju', unit: 'pcs', current_stock: 15, minimum_stock: 15, selling_price: 6000 },
  ],
  movements: [],
  stockOpnames: [],
  boms: [
    {
      id: 'bom_01',
      name: 'Resep Donat Coklat Klasik',
      product_id: 'prd_01',
      product_name: 'Donat Coklat',
      output_quantity: 20,
      output_unit: 'pcs',
      selling_price_per_unit: 5000,
      materials: [
        { material_id: 'mat_01', material_name: 'Tepung Terigu', unit: 'kg', quantity: 1 },
        { material_id: 'mat_03', material_name: 'Gula Pasir', unit: 'kg', quantity: 0.3 },
        { material_id: 'mat_02', material_name: 'Telur Ayam', unit: 'pcs', quantity: 10 },
        { material_id: 'mat_05', material_name: 'Coklat Batang', unit: 'kg', quantity: 0.4 },
      ],
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ],
  productions: [],
  sales: [],
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

// HTTP request helper targeting OpenAPI /api/v1 (proxied to Cloudflare Worker)
async function http<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: ApiResponse<T>; rawError?: any }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });

    const json = await res.json().catch(() => null);

    if (json && typeof json === 'object') {
      // Normalize tenant -> business for AuthSuccessResponse
      if (json.data && (json.data as any).tenant && !(json.data as any).business) {
        (json.data as any).business = (json.data as any).tenant;
      }
      return { ok: res.ok, status: res.status, data: json as ApiResponse<T> };
    }

    return {
      ok: res.ok,
      status: res.status,
      data: {
        success: res.ok,
        error: { code: `HTTP_${res.status}`, message: `Server error ${res.status}` },
      },
    };
  } catch (err) {
    return { ok: false, status: 0, rawError: err };
  }
}

// Full-featured API client implementing OpenAPI specification
export const api = {
  // Auth
  auth: {
    async me(): Promise<ApiResponse<{ user: User; business: Business }>> {
      const res = await http<{ user: User; business: Business }>('/auth/me');
      if (res.data) {
        if (res.data.success && res.data.data) {
          const store = getStore();
          store.user = res.data.data.user;
          store.business = res.data.data.business;
          saveStore(store);
          return res.data;
        }
        if (res.status === 401) {
          return res.data;
        }
      }

      // Offline / fallback check
      const store = getStore();
      if (store.user) {
        return {
          success: true,
          data: { user: store.user, business: store.business },
        };
      }
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Sesi telah berakhir, silakan masuk kembali.' },
      };
    },

    async login(email: string, pass: string): Promise<ApiResponse<{ user: User; business: Business }>> {
      const res = await http<{ user: User; business: Business }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password: pass }),
      });

      if (res.data) {
        if (res.data.success && res.data.data) {
          const store = getStore();
          store.user = res.data.data.user;
          store.business = res.data.data.business;
          saveStore(store);
          return res.data;
        }
        return res.data;
      }

      // Local fallback in case remote is unreachable
      const store = getStore();
      store.user = { id: 'usr_' + Date.now().toString(36), email };
      saveStore(store);
      return {
        success: true,
        data: { user: store.user, business: store.business },
      };
    },

    async register(
      email: string,
      pass: string,
      business_name: string,
      business_description?: string
    ): Promise<ApiResponse<{ user: User; business: Business }>> {
      const res = await http<{ user: User; business: Business }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password: pass,
          business_name: business_name.trim(),
          business_description: business_description || '',
        }),
      });

      if (res.data) {
        if (res.data.success && res.data.data) {
          const store = getStore();
          store.user = res.data.data.user;
          store.business = res.data.data.business;
          saveStore(store);
          return res.data;
        }
        return res.data;
      }

      // Local fallback
      const store = getStore();
      const newUser = { id: 'usr_' + Date.now().toString(36), email };
      const newBiz = { id: 'ten_' + Date.now().toString(36), name: business_name, description: business_description };
      store.user = newUser;
      store.business = newBiz;
      saveStore(store);
      return {
        success: true,
        data: { user: newUser, business: newBiz },
      };
    },

    async logout(): Promise<ApiResponse<null>> {
      await http<null>('/auth/logout', { method: 'POST' });
      const store = getStore();
      store.user = null;
      saveStore(store);
      return { success: true, data: null };
    },

    async seed(): Promise<ApiResponse<any>> {
      const res = await http<any>('/auth/seed', { method: 'POST' });
      if (res.data) return res.data;
      return { success: true };
    },
  },

  // Business profile
  business: {
    async get(): Promise<ApiResponse<Business>> {
      const res = await http<Business>('/business');
      if (res.data && res.data.success && res.data.data) {
        const store = getStore();
        store.business = res.data.data;
        saveStore(store);
        return res.data;
      }
      return { success: true, data: getStore().business };
    },

    async update(name: string, description?: string): Promise<ApiResponse<Business>> {
      const res = await http<Business>('/business', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), description: description || '' }),
      });

      if (res.data && res.data.success && res.data.data) {
        const store = getStore();
        store.business = res.data.data;
        saveStore(store);
        return res.data;
      }

      const store = getStore();
      store.business.name = name.trim() || store.business.name;
      store.business.description = description;
      saveStore(store);
      return { success: true, data: store.business };
    },
  },

  // Materials
  materials: {
    async list(search?: string | { search?: string }): Promise<ApiResponse<Material[]>> {
      const searchTerm = typeof search === 'string' ? search : search?.search;
      const query = searchTerm ? `?limit=100&search=${encodeURIComponent(searchTerm)}` : '?limit=100';
      const res = await http<Material[]>(`/materials${query}`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data;
      }
      const store = getStore();
      let list = store.materials;
      if (searchTerm?.trim()) {
        const s = searchTerm.toLowerCase();
        list = list.filter((m) => m.name.toLowerCase().includes(s));
      }
      return { success: true, data: list, meta: { total: list.length } };
    },

    async create(data: {
      name: string;
      unit: string;
      quantity_precision?: number;
      minimum_stock?: number;
      initial_stock?: number;
    }): Promise<ApiResponse<Material>> {
      const res = await http<Material>('/materials', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          unit: data.unit.trim(),
          quantity_precision: data.quantity_precision ?? 0,
          minimum_stock: data.minimum_stock ?? 0,
        }),
      });

      if (res.data?.success && res.data.data) {
        if (data.initial_stock && data.initial_stock > 0) {
          await http(`/materials/${res.data.data.id}/movements`, {
            method: 'POST',
            body: JSON.stringify({
              type: 'IN',
              quantity: data.initial_stock,
              reason_type: 'PURCHASE',
              reason_note: 'Stok awal material',
            }),
          });
          res.data.data.current_stock = data.initial_stock;
        }
        return res.data;
      }

      // Local fallback
      const store = getStore();
      const newMat: Material = {
        id: 'mat_' + Date.now().toString(36),
        name: data.name.trim(),
        unit: data.unit.trim(),
        quantity_precision: data.quantity_precision ?? 0,
        current_stock: data.initial_stock || 0,
        minimum_stock: data.minimum_stock ?? 0,
      };
      store.materials.push(newMat);
      saveStore(store);
      return { success: true, data: newMat };
    },

    async addMovement(
      material_id: string,
      type: 'IN' | 'OUT',
      quantity: number,
      reason_note?: string,
      reason_type?: string
    ): Promise<ApiResponse<any>> {
      const res = await http<any>(`/materials/${material_id}/movements`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          quantity,
          reason_type: reason_type || (type === 'IN' ? 'PURCHASE' : 'INTERNAL_USE'),
          reason_note: reason_note || '',
        }),
      });

      if (res.data) return res.data;

      // Local fallback
      const store = getStore();
      const mat = store.materials.find((m) => m.id === material_id);
      if (!mat) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Material tidak ditemukan' } };
      }
      if (type === 'OUT' && mat.current_stock < quantity) {
        return { success: false, error: { code: 'STOCK_INSUFFICIENT', message: 'Stok tidak mencukupi' } };
      }

      const before = mat.current_stock;
      mat.current_stock = type === 'IN' ? before + quantity : before - quantity;
      store.movements.unshift({
        movement_id: 'mov_' + Date.now().toString(36),
        item_type: 'MATERIAL',
        item_id: mat.id,
        item_name: mat.name,
        unit: mat.unit,
        type,
        quantity,
        stock_before: before,
        stock_after: mat.current_stock,
        reason: reason_note || '',
        timestamp: new Date().toISOString(),
      });
      saveStore(store);
      return { success: true, data: { movement_id: 'mov_' + Date.now(), stock_before: before, stock_after: mat.current_stock } };
    },

    async getMovements(material_id: string): Promise<ApiResponse<StockMovement[]>> {
      const res = await http<any[]>(`/materials/${material_id}/movements?limit=50`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const mapped: StockMovement[] = res.data.data.map((m) => ({
          movement_id: m.id || m.movement_id,
          item_type: 'MATERIAL',
          item_id: m.item_id || material_id,
          item_name: m.item_name || 'Material',
          unit: m.unit || '',
          type: m.movement_type || m.type,
          quantity: m.quantity,
          stock_before: m.stock_before,
          stock_after: m.stock_after,
          reason: m.reason_note || m.reason || '',
          timestamp: m.created_at || m.timestamp || new Date().toISOString(),
        }));
        return { success: true, data: mapped };
      }

      const store = getStore();
      const movs = store.movements.filter((m) => m.item_id === material_id);
      return { success: true, data: movs };
    },
  },

  // Products
  products: {
    async list(search?: string | { search?: string }): Promise<ApiResponse<Product[]>> {
      const searchTerm = typeof search === 'string' ? search : search?.search;
      const query = searchTerm ? `?limit=100&search=${encodeURIComponent(searchTerm)}` : '?limit=100';
      const [pRes, bRes] = await Promise.all([
        http<Product[]>(`/products${query}`),
        http<Bom[]>('/boms?limit=100'),
      ]);

      if (pRes.data && pRes.data.success && Array.isArray(pRes.data.data)) {
        const boms = (bRes.data && bRes.data.data) || [];
        // Map selling price from BoM if not present on Product directly
        const mapped = pRes.data.data.map((p) => {
          const matchingBom = boms.find((b) => b.product_id === p.id);
          return {
            ...p,
            selling_price: p.selling_price || matchingBom?.selling_price_per_unit || 0,
          };
        });
        return { success: true, data: mapped, meta: pRes.data.meta };
      }

      const store = getStore();
      let list = store.products;
      if (searchTerm?.trim()) {
        const s = searchTerm.toLowerCase();
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
      const res = await http<Product>('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          unit: data.unit.trim(),
          minimum_stock: data.minimum_stock ?? 0,
        }),
      });

      if (res.data?.success && res.data.data) {
        res.data.data.selling_price = data.selling_price || 0;
        return res.data;
      }

      // Local fallback
      const store = getStore();
      const newProd: Product = {
        id: 'prd_' + Date.now().toString(36),
        name: data.name.trim(),
        unit: data.unit.trim(),
        current_stock: 0,
        minimum_stock: data.minimum_stock ?? 0,
        selling_price: data.selling_price || 0,
      };
      store.products.push(newProd);
      saveStore(store);
      return { success: true, data: newProd };
    },

    async recordOutgoing(
      product_id: string,
      quantity: number,
      reason_type: string,
      reason_note?: string
    ): Promise<ApiResponse<any>> {
      const res = await http<any>(`/products/${product_id}/outgoing`, {
        method: 'POST',
        body: JSON.stringify({
          quantity,
          reason_type,
          reason_note: reason_note || '',
        }),
      });

      if (res.data) return res.data;

      // Local fallback
      const store = getStore();
      const p = store.products.find((item) => item.id === product_id);
      if (!p) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' } };
      }
      if (p.current_stock < quantity) {
        return { success: false, error: { code: 'STOCK_INSUFFICIENT', message: 'Stok tidak cukup' } };
      }

      const before = p.current_stock;
      p.current_stock = before - quantity;
      store.movements.unshift({
        movement_id: 'mov_' + Date.now().toString(36),
        item_type: 'PRODUCT',
        item_id: p.id,
        item_name: p.name,
        unit: p.unit,
        type: 'OUT',
        quantity,
        stock_before: before,
        stock_after: p.current_stock,
        reason: `${reason_type}: ${reason_note || 'Pengurangan produk'}`,
        timestamp: new Date().toISOString(),
      });
      saveStore(store);
      return { success: true, data: { movement_id: 'mov_' + Date.now(), stock_before: before, stock_after: p.current_stock } };
    },

    async getMovements(product_id: string): Promise<ApiResponse<StockMovement[]>> {
      const res = await http<any[]>(`/products/${product_id}/movements?limit=50`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const mapped: StockMovement[] = res.data.data.map((m) => ({
          movement_id: m.id || m.movement_id,
          item_type: 'PRODUCT',
          item_id: m.item_id || product_id,
          item_name: m.item_name || 'Produk',
          unit: m.unit || '',
          type: m.movement_type || m.type,
          quantity: m.quantity,
          stock_before: m.stock_before,
          stock_after: m.stock_after,
          reason: m.reason_note || m.reason || '',
          timestamp: m.created_at || m.timestamp || new Date().toISOString(),
        }));
        return { success: true, data: mapped };
      }

      const store = getStore();
      const movs = store.movements.filter((m) => m.item_id === product_id);
      return { success: true, data: movs };
    },
  },

  // Bill of Materials (BoM / Resep)
  boms: {
    async list(search?: string): Promise<ApiResponse<Bom[]>> {
      const query = search ? `?limit=100&search=${encodeURIComponent(search)}` : '?limit=100';
      const [bRes, pRes] = await Promise.all([
        http<Bom[]>(`/boms${query}`),
        http<Product[]>('/products?limit=100'),
      ]);

      if (bRes.data && bRes.data.success && Array.isArray(bRes.data.data)) {
        const [mRes, products] = await Promise.all([
          http<Material[]>('/materials?limit=100'),
          (pRes.data && pRes.data.data) || [],
        ]);
        const materialsList = (mRes.data && mRes.data.data) || [];

        const enriched = await Promise.all(
          bRes.data.data.map(async (b) => {
            const prod = products.find((p) => p.id === b.product_id);
            let rawMaterials = b.materials;
            if (!rawMaterials || rawMaterials.length === 0) {
              const detail = await http<Bom>(`/boms/${b.id}`);
              if (detail.data?.success && Array.isArray(detail.data.data?.materials)) {
                rawMaterials = detail.data.data.materials;
              }
            }
            const enrichedMaterials = (rawMaterials || []).map((m: any) => {
              const mat = materialsList.find((item) => item.id === m.material_id);
              return {
                material_id: m.material_id,
                material_name: m.material_name || mat?.name || 'Material',
                unit: m.unit || mat?.unit || '',
                quantity: m.quantity,
              };
            });
            return {
              ...b,
              product_name: b.product_name || prod?.name || '',
              materials: enrichedMaterials,
            };
          })
        );
        return { success: true, data: enriched, meta: bRes.data.meta };
      }

      const store = getStore();
      let list = store.boms;
      if (search?.trim()) {
        const s = search.toLowerCase();
        list = list.filter((b) => b.name.toLowerCase().includes(s));
      }
      return { success: true, data: list };
    },

    async getById(id: string): Promise<ApiResponse<Bom>> {
      const [res, mRes, pRes] = await Promise.all([
        http<Bom>(`/boms/${id}`),
        http<Material[]>('/materials?limit=100'),
        http<Product[]>('/products?limit=100'),
      ]);

      if (res.data && res.data.success && res.data.data) {
        const materials = (mRes.data && mRes.data.data) || [];
        const products = (pRes.data && pRes.data.data) || [];
        const bom = res.data.data;
        const prod = products.find((p) => p.id === bom.product_id);

        const enrichedMaterials = (bom.materials || []).map((m: any) => {
          const mat = materials.find((item) => item.id === m.material_id);
          return {
            material_id: m.material_id,
            material_name: m.material_name || mat?.name || 'Material',
            unit: m.unit || mat?.unit || '',
            quantity: m.quantity,
          };
        });

        return {
          success: true,
          data: {
            ...bom,
            product_name: bom.product_name || prod?.name || '',
            materials: enrichedMaterials,
          },
        };
      }

      const store = getStore();
      const found = store.boms.find((b) => b.id === id);
      if (!found) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Resep tidak ditemukan' } };
      }
      return { success: true, data: found };
    },

    async create(data: {
      name: string;
      product_id: string;
      output_quantity: number;
      output_unit: string;
      selling_price_per_unit?: number;
      materials: { material_id: string; quantity: number }[];
    }): Promise<ApiResponse<Bom>> {
      const res = await http<Bom>('/boms', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.data) return res.data;

      // Local fallback
      const store = getStore();
      const p = store.products.find((prod) => prod.id === data.product_id);
      const newBom: Bom = {
        id: 'bom_' + Date.now().toString(36),
        name: data.name,
        product_id: data.product_id,
        product_name: p?.name || '',
        output_quantity: data.output_quantity,
        output_unit: data.output_unit,
        selling_price_per_unit: data.selling_price_per_unit || 0,
        materials: data.materials.map((m) => {
          const mat = store.materials.find((item) => item.id === m.material_id);
          return {
            material_id: m.material_id,
            material_name: mat?.name || '',
            unit: mat?.unit || '',
            quantity: m.quantity,
          };
        }),
        created_at: new Date().toISOString(),
      };
      store.boms.push(newBom);
      saveStore(store);
      return { success: true, data: newBom };
    },

    async update(
      id: string,
      data: {
        name?: string;
        output_quantity?: number;
        selling_price_per_unit?: number;
        materials?: { material_id: string; quantity: number }[];
      }
    ): Promise<ApiResponse<Bom>> {
      const res = await http<Bom>(`/boms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      if (res.data) return res.data;

      const store = getStore();
      const bom = store.boms.find((b) => b.id === id);
      if (!bom) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Resep tidak ditemukan' } };
      }
      if (data.name) bom.name = data.name;
      if (data.output_quantity) bom.output_quantity = data.output_quantity;
      if (data.selling_price_per_unit !== undefined) bom.selling_price_per_unit = data.selling_price_per_unit;
      if (data.materials) {
        bom.materials = data.materials.map((m) => {
          const mat = store.materials.find((item) => item.id === m.material_id);
          return {
            material_id: m.material_id,
            material_name: mat?.name || '',
            unit: mat?.unit || '',
            quantity: m.quantity,
          };
        });
      }
      saveStore(store);
      return { success: true, data: bom };
    },
  },

  // Production
  production: {
    async preview(product_id: string, target_output_quantity: number): Promise<ApiResponse<ProductionPreview>> {
      const [res, mRes, pRes] = await Promise.all([
        http<any>('/productions/preview', {
          method: 'POST',
          body: JSON.stringify({ product_id, target_output_quantity }),
        }),
        http<Material[]>('/materials?limit=100'),
        http<Product[]>('/products?limit=100'),
      ]);

      if (res.data && res.data.success && res.data.data) {
        const materials = (mRes.data && mRes.data.data) || [];
        const products = (pRes.data && pRes.data.data) || [];
        const prod = products.find((p) => p.id === product_id);

        const enrichedMaterials = (res.data.data.materials || []).map((m: any) => {
          const mat = materials.find((item) => item.id === m.material_id);
          return {
            material_id: m.material_id,
            material_name: mat?.name || 'Material',
            unit: m.unit || mat?.unit || '',
            calculated_quantity: m.calculated_quantity,
            available_quantity: m.available_quantity !== undefined ? m.available_quantity : (mat?.current_stock || 0),
            quantity_precision: mat?.quantity_precision ?? 2,
          };
        });

        return {
          success: true,
          data: {
            ...res.data.data,
            product_name: prod?.name || '',
            materials: enrichedMaterials,
          },
        };
      }

      // Local fallback
      const store = getStore();
      const bom = store.boms.find((b) => b.product_id === product_id);
      const prod = store.products.find((p) => p.id === product_id);
      if (!bom || !prod) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Resep untuk produk ini tidak ditemukan' } };
      }

      const multiplier = target_output_quantity / bom.output_quantity;
      const previewMaterials = bom.materials.map((m) => {
        const mat = store.materials.find((item) => item.id === m.material_id);
        const calcQty = Number((m.quantity * multiplier).toFixed(mat?.quantity_precision || 2));
        return {
          material_id: m.material_id,
          material_name: m.material_name || mat?.name || '',
          calculated_quantity: calcQty,
          unit: m.unit || mat?.unit || '',
          available_quantity: mat?.current_stock || 0,
          quantity_precision: mat?.quantity_precision || 2,
        };
      });

      const errors: string[] = [];
      previewMaterials.forEach((m) => {
        if (m.available_quantity < m.calculated_quantity) {
          errors.push(`Stok ${m.material_name} tidak mencukupi (Kurang ${(m.calculated_quantity - m.available_quantity).toFixed(2)} ${m.unit})`);
        }
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
          bom_multiplier: multiplier,
          materials: previewMaterials,
          stock_check: {
            can_produce: errors.length === 0,
            errors,
          },
        },
      };
    },

    async commit(data: {
      product_id: string;
      bom_id: string;
      target_output_quantity: number;
      actual_output_quantity: number;
      materials: { material_id: string; calculated_quantity: number; actual_quantity: number }[];
      note?: string;
    }): Promise<ApiResponse<ProductionRecord>> {
      const res = await http<ProductionRecord>('/productions', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.data) return res.data;

      // Local fallback
      const store = getStore();
      const prod = store.products.find((p) => p.id === data.product_id);
      const newProdRec: ProductionRecord = {
        id: 'prod_' + Date.now().toString(36),
        product_id: data.product_id,
        product_name: prod?.name || '',
        bom_id: data.bom_id,
        target_output_quantity: data.target_output_quantity,
        actual_output_quantity: data.actual_output_quantity,
        bom_multiplier: 1,
        materials: data.materials.map((m) => ({
          ...m,
          material_name: store.materials.find((item) => item.id === m.material_id)?.name || '',
        })),
        note: data.note,
        created_at: new Date().toISOString(),
      };
      store.productions.unshift(newProdRec);
      saveStore(store);
      return { success: true, data: newProdRec };
    },

    async list(product_id?: string): Promise<ApiResponse<ProductionRecord[]>> {
      const query = product_id ? `?limit=100&product_id=${encodeURIComponent(product_id)}` : '?limit=100';
      const [res, pRes] = await Promise.all([
        http<ProductionRecord[]>(`/productions${query}`),
        http<Product[]>('/products?limit=100'),
      ]);

      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const [mRes, products] = await Promise.all([
          http<Material[]>('/materials?limit=100'),
          (pRes.data && pRes.data.data) || [],
        ]);
        const materialsList = (mRes.data && mRes.data.data) || [];

        const enriched = await Promise.all(
          res.data.data.map(async (pr) => {
            let rawMaterials = pr.materials;
            if (!rawMaterials || rawMaterials.length === 0) {
              const detail = await http<ProductionRecord>(`/productions/${pr.id}`);
              if (detail.data?.success && Array.isArray(detail.data.data?.materials)) {
                rawMaterials = detail.data.data.materials;
              }
            }
            const enrichedMaterials = (rawMaterials || []).map((m: any) => {
              const mat = materialsList.find((item) => item.id === m.material_id);
              return {
                ...m,
                material_name: m.material_name || mat?.name || 'Material',
                unit: m.unit || mat?.unit || '',
              };
            });
            return {
              ...pr,
              product_name: pr.product_name || products.find((p) => p.id === pr.product_id)?.name || 'Produk',
              materials: enrichedMaterials,
            };
          })
        );
        return { success: true, data: enriched, meta: res.data.meta };
      }

      const store = getStore();
      let list = store.productions;
      if (product_id) list = list.filter((p) => p.product_id === product_id);
      return { success: true, data: list };
    },

    async getById(id: string): Promise<ApiResponse<ProductionRecord>> {
      const [res, mRes, pRes] = await Promise.all([
        http<ProductionRecord>(`/productions/${id}`),
        http<Material[]>('/materials?limit=100'),
        http<Product[]>('/products?limit=100'),
      ]);

      if (res.data && res.data.success && res.data.data) {
        const materials = (mRes.data && mRes.data.data) || [];
        const products = (pRes.data && pRes.data.data) || [];
        const record = res.data.data;
        const prod = products.find((p) => p.id === record.product_id);

        const enrichedMaterials = (record.materials || []).map((m: any) => {
          const mat = materials.find((item) => item.id === m.material_id);
          return {
            ...m,
            material_name: m.material_name || mat?.name || 'Material',
            unit: m.unit || mat?.unit || '',
          };
        });

        return {
          success: true,
          data: {
            ...record,
            product_name: record.product_name || prod?.name || '',
            materials: enrichedMaterials,
          },
        };
      }

      const store = getStore();
      const found = store.productions.find((p) => p.id === id);
      if (!found) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Data produksi tidak ditemukan' } };
      }
      return { success: true, data: found };
    },
  },

  // Alias for plural naming compatibility
  get productions() {
    return this.production;
  },

  // POS / Penjualan
  sales: {
    async create(items: { product_id: string; quantity: number }[]): Promise<ApiResponse<Sale>> {
      const res = await http<Sale>('/sales', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });

      if (res.data) return res.data;

      // Local fallback
      const store = getStore();
      let total = 0;
      const saleItems = items.map((item) => {
        const p = store.products.find((prod) => prod.id === item.product_id);
        const unit_price = p?.selling_price || 0;
        const subtotal = unit_price * item.quantity;
        total += subtotal;
        if (p) p.current_stock -= item.quantity;
        return {
          product_id: item.product_id,
          product_name: p?.name || 'Produk',
          quantity: item.quantity,
          unit_price,
          subtotal,
        };
      });

      const newSale: Sale = {
        id: 'sale_' + Date.now().toString(36),
        items: saleItems,
        total,
        created_at: new Date().toISOString(),
      };
      store.sales.unshift(newSale);
      saveStore(store);
      return { success: true, data: newSale };
    },

    async list(from?: string, to?: string): Promise<ApiResponse<Sale[]>> {
      let query = '?limit=100';
      if (from) query += `&from=${from}`;
      if (to) query += `&to=${to}`;

      const [res, prodRes] = await Promise.all([
        http<Sale[]>(`/sales${query}`),
        http<Product[]>('/products?limit=100'),
      ]);

      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const products = (prodRes.data && prodRes.data.data) || [];
        const enrichedSales = res.data.data.map((sale) => ({
          ...sale,
          items: (sale.items || []).map((item) => {
            const prod = products.find((p) => p.id === item.product_id);
            return {
              ...item,
              product_name: item.product_name || prod?.name || 'Produk',
            };
          }),
        }));
        return { success: true, data: enrichedSales, meta: res.data.meta };
      }

      const store = getStore();
      return { success: true, data: store.sales };
    },
  },

  // Stock Opnames
  stockOpname: {
    async create(data: {
      item_type: 'MATERIAL' | 'PRODUCT';
      item_id: string;
      actual_quantity: number;
      note?: string;
    }): Promise<ApiResponse<any>> {
      const res = await http<any>('/stock-opnames', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.data) return res.data;

      // Local fallback
      const store = getStore();
      let name = '';
      let unit = '';
      let sysQty = 0;

      if (data.item_type === 'MATERIAL') {
        const m = store.materials.find((item) => item.id === data.item_id);
        if (m) {
          name = m.name;
          unit = m.unit;
          sysQty = m.current_stock;
          m.current_stock = data.actual_quantity;
        }
      } else {
        const p = store.products.find((item) => item.id === data.item_id);
        if (p) {
          name = p.name;
          unit = p.unit;
          sysQty = p.current_stock;
          p.current_stock = data.actual_quantity;
        }
      }

      const record: StockOpnameRecord = {
        opname_id: 'opn_' + Date.now().toString(36),
        item_type: data.item_type,
        item_id: data.item_id,
        item_name: name,
        unit,
        system_quantity: sysQty,
        actual_quantity: data.actual_quantity,
        difference: data.actual_quantity - sysQty,
        stock_after: data.actual_quantity,
        note: data.note,
        created_at: new Date().toISOString(),
      };
      store.stockOpnames.unshift(record);
      saveStore(store);
      return { success: true, data: record };
    },

    async list(): Promise<ApiResponse<StockOpnameRecord[]>> {
      const [res, mRes, pRes] = await Promise.all([
        http<any[]>('/stock-opnames?limit=100'),
        http<Material[]>('/materials?limit=100'),
        http<Product[]>('/products?limit=100'),
      ]);

      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const materials = (mRes.data && mRes.data.data) || [];
        const products = (pRes.data && pRes.data.data) || [];

        const mapped: StockOpnameRecord[] = res.data.data.map((item) => {
          let name = 'Item';
          let unit = '';
          if (item.item_type === 'MATERIAL') {
            const m = materials.find((mat) => mat.id === item.item_id);
            if (m) {
              name = m.name;
              unit = m.unit;
            }
          } else {
            const p = products.find((prod) => prod.id === item.item_id);
            if (p) {
              name = p.name;
              unit = p.unit;
            }
          }

          return {
            opname_id: item.id || item.opname_id,
            item_type: item.item_type,
            item_id: item.item_id,
            item_name: item.item_name || name,
            unit: item.unit || unit,
            system_quantity: item.system_quantity,
            actual_quantity: item.actual_quantity,
            difference: item.difference,
            stock_after: item.actual_quantity,
            note: item.note,
            created_at: item.created_at,
          };
        });

        return { success: true, data: mapped, meta: res.data.meta };
      }

      const store = getStore();
      return { success: true, data: store.stockOpnames };
    },
  },

  // Unified Movements
  movements: {
    async list(): Promise<ApiResponse<StockMovement[]>> {
      const [mRes, pRes] = await Promise.all([
        http<Material[]>('/materials?limit=50'),
        http<Product[]>('/products?limit=50'),
      ]);

      const materials = (mRes.data && mRes.data.data) || [];
      const products = (pRes.data && pRes.data.data) || [];

      if (materials.length > 0 || products.length > 0) {
        const promises: Promise<any>[] = [];

        materials.slice(0, 10).forEach((mat) => {
          promises.push(
            http<any[]>(`/materials/${mat.id}/movements?limit=20`).then((res) => {
              if (res.data?.success && Array.isArray(res.data.data)) {
                return res.data.data.map((m) => ({
                  movement_id: m.id || m.movement_id,
                  item_type: 'MATERIAL' as const,
                  item_id: mat.id,
                  item_name: mat.name,
                  unit: mat.unit,
                  type: (m.movement_type || m.type) as any,
                  quantity: m.quantity,
                  stock_before: m.stock_before,
                  stock_after: m.stock_after,
                  reason: m.reason_note || m.reason || '',
                  timestamp: m.created_at || m.timestamp || new Date().toISOString(),
                }));
              }
              return [];
            })
          );
        });

        products.slice(0, 10).forEach((prod) => {
          promises.push(
            http<any[]>(`/products/${prod.id}/movements?limit=20`).then((res) => {
              if (res.data?.success && Array.isArray(res.data.data)) {
                return res.data.data.map((m) => ({
                  movement_id: m.id || m.movement_id,
                  item_type: 'PRODUCT' as const,
                  item_id: prod.id,
                  item_name: prod.name,
                  unit: prod.unit,
                  type: (m.movement_type || m.type) as any,
                  quantity: m.quantity,
                  stock_before: m.stock_before,
                  stock_after: m.stock_after,
                  reason: m.reason_note || m.reason || '',
                  timestamp: m.created_at || m.timestamp || new Date().toISOString(),
                }));
              }
              return [];
            })
          );
        });

        const results = await Promise.all(promises);
        const combined = results.flat().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (combined.length > 0) {
          return { success: true, data: combined };
        }
      }

      const store = getStore();
      return { success: true, data: store.movements };
    },
  },

  // Dashboard Summary
  dashboard: {
    async getSummary(from?: string, to?: string): Promise<ApiResponse<DashboardSummary>> {
      let query = '';
      if (from && to) query = `?from=${from}&to=${to}`;
      const res = await http<DashboardSummary>(`/dashboard/summary${query}`);
      if (res.data && res.data.success && res.data.data) {
        return res.data;
      }

      const store = getStore();
      const totalSales = store.sales.reduce((acc, s) => acc + s.total, 0);
      const lowMaterials = store.materials.filter((m) => m.current_stock <= m.minimum_stock).length;
      const lowProducts = store.products.filter((p) => p.current_stock <= p.minimum_stock).length;
      const totalProdUnits = store.productions.reduce((acc, p) => acc + p.actual_output_quantity, 0);

      return {
        success: true,
        data: {
          sales: {
            total: totalSales,
            transaction_count: store.sales.length,
          },
          production: {
            production_count: store.productions.length,
            output_quantity: totalProdUnits,
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
      const res = await http<Insight[]>('/insights?limit=10');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data;
      }

      const store = getStore();
      return { success: true, data: store.insights };
    },

    async generate(period_from?: string, period_to?: string): Promise<ApiResponse<Insight>> {
      const today = new Date().toISOString().split('T')[0];
      const from = period_from || today;
      const to = period_to || today;

      const res = await http<Insight>('/insights/generate', {
        method: 'POST',
        body: JSON.stringify({ period_from: from, period_to: to }),
      });

      if (res.data && res.data.success && res.data.data) {
        return res.data;
      }

      // Local fallback
      const store = getStore();
      const newInsight: Insight = {
        id: 'ins_' + Date.now().toString(36),
        generated_at: new Date().toISOString(),
        data_as_of: new Date().toISOString(),
        content: [
          {
            type: 'WARNING',
            title: 'Peringatan Stok Rendah',
            body: 'Terdapat bahan baku atau produk yang berada di bawah stok minimum.',
          },
          {
            type: 'OPPORTUNITY',
            title: 'Optimalisasi Produksi',
            body: 'Tingkatkan efisiensi bahan dengan menyesuaikan resep BoM secara berkala.',
          },
          {
            type: 'TIP',
            title: 'Rutin Lakukan Opname Fisik',
            body: 'Cocokkan stok riil di gudang dengan catatan sistem UsahaKita.',
          },
        ],
      };
      store.insights.unshift(newInsight);
      saveStore(store);
      return { success: true, data: newInsight };
    },
  },

  // Reset / Clear local sample
  devReset() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  },
};
