import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import products from '../routes/products';

function createMockEnv(): Env {
  const mockTenantDo = {
    listProducts: vi.fn(async (page: number, limit: number, search?: string) => ({
      data: [
        { id: 'prd_01', name: 'Donat Coklat', unit: 'pcs', current_stock: 35, minimum_stock: 20, created_at: '2026-01-01', updated_at: '2026-01-01', selling_price_per_unit: 5000 },
      ],
      meta: { page, limit, total: 1 },
    })),
    createProduct: vi.fn(async (name: string, unit: string, ms: number) => ({
      id: 'prd_new', name, unit, current_stock: 0, minimum_stock: ms, created_at: '2026-01-01', updated_at: '2026-01-01', selling_price_per_unit: null,
    })),
    createProductOutgoing: vi.fn(async (id: string, qty: number, rt: string, rn?: string) => ({
      id: 'mov_new', item_type: 'PRODUCT', item_id: id, movement_type: 'OUT', quantity: qty, stock_before: 35, stock_after: 35 - qty, reason_type: rt, reason_note: rn || null, reference_type: null, reference_id: null, created_at: '2026-01-01',
    })),
    listProductMovements: vi.fn(async (id: string, page: number, limit: number) => ({
      data: [],
      meta: { page, limit, total: 0 },
    })),
  };

  return {
    AUTH_DO: {
      idFromName: vi.fn(),
      get: vi.fn(() => ({
        validateSession: vi.fn(async () => ({ userId: 'usr_01', tenantId: 'ten_01', sessionId: 'ses_01' })),
      })),
    } as unknown as DurableObjectNamespace,
    TENANT_DO: {
      idFromName: vi.fn(),
      get: vi.fn(() => mockTenantDo),
    } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('Products routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => {
      c.env = env;
      await next();
    });
    app.route('/api/v1/products', products);
  });

  it('GET / returns paginated products', async () => {
    const res = await app.request('/api/v1/products', {
      headers: { Cookie: 'session_token=test-token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Donat Coklat');
  });

  it('POST / creates a product', async () => {
    const res = await app.request('/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ name: 'Roti Manis', unit: 'pcs', minimum_stock: 10 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Roti Manis');
  });

  it('POST / returns 422 for missing fields', async () => {
    const res = await app.request('/api/v1/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ name: 'Roti' }),
    });
    expect(res.status).toBe(422);
  });

  it('POST /:id/outgoing creates outgoing movement', async () => {
    const res = await app.request('/api/v1/products/prd_01/outgoing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ quantity: 5, reason_type: 'SALE', reason_note: 'Cash sale' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.movement_type).toBe('OUT');
  });

  it('POST /:id/outgoing returns 422 for zero quantity', async () => {
    const res = await app.request('/api/v1/products/prd_01/outgoing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ quantity: 0, reason_type: 'SALE' }),
    });
    expect(res.status).toBe(422);
  });

  it('GET /:id/movements returns movement list', async () => {
    const res = await app.request('/api/v1/products/prd_01/movements', {
      headers: { Cookie: 'session_token=test-token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
