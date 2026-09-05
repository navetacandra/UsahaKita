import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import productions from '../routes/productions';

function createMockEnv(): Env {
  const mockTenantDo = {
    previewProduction: vi.fn(async () => ({
      product_id: 'prd_01', target_output_quantity: 20,
      materials: [{ material_id: 'mat_01', name: 'Tepung Terigu', required: 1, available: 12.5 }],
    })),
    commitProduction: vi.fn(async () => ({
      id: 'prod_new', bom_id: 'bom_01', product_id: 'prd_01', target_output_quantity: 20, actual_output_quantity: 20, bom_multiplier: 1, note: 'Test', created_at: '2026-01-01',
    })),
    listProductions: vi.fn(async (page: number, limit: number) => ({
      data: [{ id: 'prod_01', bom_id: 'bom_01', product_id: 'prd_01', target_output_quantity: 20, actual_output_quantity: 20, bom_multiplier: 1, note: 'Test', created_at: '2026-01-01' }],
      meta: { page, limit, total: 1 },
    })),
    getProduction: vi.fn(async (id: string) => ({ id, bom_id: 'bom_01', product_id: 'prd_01', target_output_quantity: 20, actual_output_quantity: 20, bom_multiplier: 1, note: 'Test', created_at: '2026-01-01' })),
  };

  return {
    AUTH_DO: { idFromName: vi.fn(), get: vi.fn(() => ({ validateSession: vi.fn(async () => ({ userId: 'usr_01', tenantId: 'ten_01', sessionId: 'ses_01' })) })) } as unknown as DurableObjectNamespace,
    TENANT_DO: { idFromName: vi.fn(), get: vi.fn(() => mockTenantDo) } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('Productions routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => { c.env = env; await next(); });
    app.route('/api/v1/productions', productions);
  });

  it('POST /preview returns preview data', async () => {
    const res = await app.request('/api/v1/productions/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ product_id: 'prd_01', target_output_quantity: 20 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.materials).toBeDefined();
  });

  it('POST /preview returns 422 for missing fields', async () => {
    const res = await app.request('/api/v1/productions/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ product_id: 'prd_01' }),
    });
    expect(res.status).toBe(422);
  });

  it('POST / commits a production', async () => {
    const res = await app.request('/api/v1/productions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({
        product_id: 'prd_01', bom_id: 'bom_01', target_output_quantity: 20, actual_output_quantity: 20,
        materials: [{ material_id: 'mat_01', calculated_quantity: 1, actual_quantity: 1 }],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('GET / returns paginated productions', async () => {
    const res = await app.request('/api/v1/productions', { headers: { Cookie: 'session_token=test' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it('GET /:id returns a production', async () => {
    const res = await app.request('/api/v1/productions/prod_01', { headers: { Cookie: 'session_token=test' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe('prod_01');
  });
});
