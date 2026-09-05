import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import materials from '../routes/materials';

function createMockEnv(): Env {
  const mockTenantDo = {
    listMaterials: vi.fn(async (page: number, limit: number, search?: string) => ({
      data: [
        { id: 'mat_01', name: 'Tepung Terigu', unit: 'kg', quantity_precision: 2, current_stock: 12.5, minimum_stock: 5, created_at: '2026-01-01', updated_at: '2026-01-01' },
      ],
      meta: { page, limit, total: 1 },
    })),
    createMaterial: vi.fn(async (name: string, unit: string, qp: number, ms: number) => ({
      id: 'mat_new', name, unit, quantity_precision: qp, current_stock: 0, minimum_stock: ms, created_at: '2026-01-01', updated_at: '2026-01-01',
    })),
    createMaterialMovement: vi.fn(async (id: string, type: string, qty: number, rt?: string, rn?: string) => ({
      id: 'mov_new', item_type: 'MATERIAL', item_id: id, movement_type: type, quantity: qty, stock_before: 0, stock_after: qty, reason_type: rt || null, reason_note: rn || null, reference_type: null, reference_id: null, created_at: '2026-01-01',
    })),
    listMaterialMovements: vi.fn(async (id: string, page: number, limit: number) => ({
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

describe('Materials routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => {
      c.env = env;
      await next();
    });
    app.route('/api/v1/materials', materials);
  });

  it('GET / returns paginated materials', async () => {
    const res = await app.request('/api/v1/materials', {
      headers: { Cookie: 'session_token=test-token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it('POST / creates a material', async () => {
    const res = await app.request('/api/v1/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ name: 'Gula', unit: 'kg', quantity_precision: 2, minimum_stock: 1 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Gula');
  });

  it('POST / returns 422 for missing fields', async () => {
    const res = await app.request('/api/v1/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ name: 'Gula' }),
    });
    expect(res.status).toBe(422);
  });

  it('POST /:id/movements creates a movement', async () => {
    const res = await app.request('/api/v1/materials/mat_01/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ type: 'IN', quantity: 5, reason_type: 'PURCHASE', reason_note: 'Weekly restock' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.movement_type).toBe('IN');
  });

  it('POST /:id/movements returns 422 for invalid type', async () => {
    const res = await app.request('/api/v1/materials/mat_01/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ type: 'INVALID', quantity: 5 }),
    });
    expect(res.status).toBe(422);
  });

  it('POST /:id/movements returns 422 for non-positive quantity', async () => {
    const res = await app.request('/api/v1/materials/mat_01/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test-token' },
      body: JSON.stringify({ type: 'IN', quantity: 0 }),
    });
    expect(res.status).toBe(422);
  });

  it('GET /:id/movements returns movement list', async () => {
    const res = await app.request('/api/v1/materials/mat_01/movements', {
      headers: { Cookie: 'session_token=test-token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
