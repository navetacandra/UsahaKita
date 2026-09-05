import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import stockOpname from '../routes/stock-opname';

function createMockEnv(): Env {
  const mockTenantDo = {
    createStockOpname: vi.fn(async (itemType: string, itemId: string, actualQty: number, note?: string) => ({
      id: 'opn_new', item_type: itemType, item_id: itemId, system_quantity: 0, actual_quantity: actualQty, note: note || null, status: 'COMPLETED', created_at: '2026-01-01',
    })),
    listStockOpnames: vi.fn(async (page: number, limit: number) => ({
      data: [{ id: 'opn_01', item_type: 'MATERIAL', item_id: 'mat_01', system_quantity: 0, actual_quantity: 12.5, status: 'COMPLETED', created_at: '2026-01-01' }],
      meta: { page, limit, total: 1 },
    })),
  };

  return {
    AUTH_DO: { idFromName: vi.fn(), get: vi.fn(() => ({ validateSession: vi.fn(async () => ({ userId: 'usr_01', tenantId: 'ten_01', sessionId: 'ses_01' })) })) } as unknown as DurableObjectNamespace,
    TENANT_DO: { idFromName: vi.fn(), get: vi.fn(() => mockTenantDo) } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('Stock Opname routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => { c.env = env; await next(); });
    app.route('/api/v1/stock-opname', stockOpname);
  });

  it('POST / creates stock opname', async () => {
    const res = await app.request('/api/v1/stock-opname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ item_type: 'MATERIAL', item_id: 'mat_01', actual_quantity: 12.5 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.item_type).toBe('MATERIAL');
  });

  it('POST / returns 422 for missing fields', async () => {
    const res = await app.request('/api/v1/stock-opname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ item_type: 'MATERIAL' }),
    });
    expect(res.status).toBe(422);
  });

  it('POST / returns 422 for invalid item_type', async () => {
    const res = await app.request('/api/v1/stock-opname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ item_type: 'INVALID', item_id: 'mat_01', actual_quantity: 5 }),
    });
    expect(res.status).toBe(422);
  });

  it('GET / returns paginated stock opnames', async () => {
    const res = await app.request('/api/v1/stock-opname', {
      headers: { Cookie: 'session_token=test' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});
