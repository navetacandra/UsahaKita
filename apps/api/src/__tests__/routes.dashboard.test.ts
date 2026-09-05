import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import dashboard from '../routes/dashboard';

function createMockEnv(): Env {
  const mockTenantDo = {
    getDashboardSummary: vi.fn(async () => ({
      materials: { count: 5, low_stock: 2 },
      products: { count: 3, low_stock: 1 },
      boms: { count: 2 },
      recent_sales: [{ id: 'sale_01', total: 25000, created_at: '2026-01-01' }],
      recent_productions: [{ id: 'prod_01', created_at: '2026-01-01' }],
    })),
  };

  return {
    AUTH_DO: { idFromName: vi.fn(), get: vi.fn(() => ({ validateSession: vi.fn(async () => ({ userId: 'usr_01', tenantId: 'ten_01', sessionId: 'ses_01' })) })) } as unknown as DurableObjectNamespace,
    TENANT_DO: { idFromName: vi.fn(), get: vi.fn(() => mockTenantDo) } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('Dashboard route', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => { c.env = env; await next(); });
    app.route('/api/v1/dashboard', dashboard);
  });

  it('GET /summary returns dashboard data', async () => {
    const res = await app.request('/api/v1/dashboard/summary', {
      headers: { Cookie: 'session_token=test' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.materials.count).toBe(5);
    expect(body.data.materials.low_stock).toBe(2);
    expect(body.data.products.count).toBe(3);
    expect(body.data.boms.count).toBe(2);
    expect(body.data.recent_sales).toHaveLength(1);
    expect(body.data.recent_productions).toHaveLength(1);
  });
});
