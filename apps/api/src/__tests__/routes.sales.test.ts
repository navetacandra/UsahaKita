import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import sales from '../routes/sales';

function createMockEnv(): Env {
  const mockTenantDo = {
    commitSale: vi.fn(async (items: unknown[]) => ({
      id: 'sale_new', total: 25000, created_at: '2026-01-01',
      items: items.map((item: any) => ({ sale_id: 'sale_new', product_id: item.product_id, quantity: item.quantity, unit_price: 5000, subtotal: item.quantity * 5000 })),
    })),
    listSales: vi.fn(async (page: number, limit: number, from?: string, to?: string) => ({
      data: [{ id: 'sale_01', total: 25000, created_at: '2026-01-01', items: [] }],
      meta: { page, limit, total: 1 },
    })),
  };

  return {
    AUTH_DO: { idFromName: vi.fn(), get: vi.fn(() => ({ validateSession: vi.fn(async () => ({ userId: 'usr_01', tenantId: 'ten_01', sessionId: 'ses_01' })) })) } as unknown as DurableObjectNamespace,
    TENANT_DO: { idFromName: vi.fn(), get: vi.fn(() => mockTenantDo) } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('Sales routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => { c.env = env; await next(); });
    app.route('/api/v1/sales', sales);
  });

  it('POST / creates a sale', async () => {
    const res = await app.request('/api/v1/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ items: [{ product_id: 'prd_01', quantity: 5 }] }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(25000);
  });

  it('POST / returns 422 for empty items', async () => {
    const res = await app.request('/api/v1/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ items: [] }),
    });
    expect(res.status).toBe(422);
  });

  it('POST / returns 422 for invalid item', async () => {
    const res = await app.request('/api/v1/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ items: [{ product_id: 'prd_01', quantity: 0 }] }),
    });
    expect(res.status).toBe(422);
  });

  it('GET / returns paginated sales', async () => {
    const res = await app.request('/api/v1/sales', { headers: { Cookie: 'session_token=test' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});
