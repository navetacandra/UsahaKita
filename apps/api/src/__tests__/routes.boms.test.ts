import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import boms from '../routes/boms';

function createMockEnv(): Env {
  const mockTenantDo = {
    listBoms: vi.fn(async (page: number, limit: number, search?: string) => ({
      data: [{ id: 'bom_01', name: 'Resep Donat', product_id: 'prd_01', output_quantity: 20, output_unit: 'pcs', selling_price_per_unit: 5000, created_at: '2026-01-01', updated_at: '2026-01-01' }],
      meta: { page, limit, total: 1 },
    })),
    createBom: vi.fn(async () => ({ id: 'bom_new', name: 'New BOM', product_id: 'prd_01', output_quantity: 10, output_unit: 'pcs', selling_price_per_unit: 3000, created_at: '2026-01-01', updated_at: '2026-01-01' })),
    getBom: vi.fn(async (id: string) => ({ id, name: 'Resep Donat', product_id: 'prd_01', output_quantity: 20, output_unit: 'pcs', selling_price_per_unit: 5000, created_at: '2026-01-01', updated_at: '2026-01-01' })),
    updateBom: vi.fn(async (id: string, body: Record<string, unknown>) => ({ id, name: 'Updated', product_id: 'prd_01', output_quantity: 20, output_unit: 'pcs', selling_price_per_unit: 5000, created_at: '2026-01-01', updated_at: '2026-01-01' })),
  };

  return {
    AUTH_DO: { idFromName: vi.fn(), get: vi.fn(() => ({ validateSession: vi.fn(async () => ({ userId: 'usr_01', tenantId: 'ten_01', sessionId: 'ses_01' })) })) } as unknown as DurableObjectNamespace,
    TENANT_DO: { idFromName: vi.fn(), get: vi.fn(() => mockTenantDo) } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('BOMs routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => { c.env = env; await next(); });
    app.route('/api/v1/boms', boms);
  });

  it('GET / returns paginated BOMs', async () => {
    const res = await app.request('/api/v1/boms', { headers: { Cookie: 'session_token=test' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it('POST / creates a BOM', async () => {
    const res = await app.request('/api/v1/boms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ name: 'New BOM', product_id: 'prd_01', output_quantity: 10, output_unit: 'pcs', selling_price_per_unit: 3000, materials: [{ material_id: 'mat_01', quantity: 1 }] }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('POST / returns 422 for missing fields', async () => {
    const res = await app.request('/api/v1/boms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ name: 'BOM' }),
    });
    expect(res.status).toBe(422);
  });

  it('GET /:id returns a BOM', async () => {
    const res = await app.request('/api/v1/boms/bom_01', { headers: { Cookie: 'session_token=test' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe('bom_01');
  });

  it('PATCH /:id updates a BOM', async () => {
    const res = await app.request('/api/v1/boms/bom_01', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ name: 'Updated' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
