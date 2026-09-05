import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import insights from '../routes/insights';

function createMockEnv(): Env {
  const mockTenantDo = {
    listInsights: vi.fn(async (limit: number) => ({
      data: [{ id: 'ins_01', summary: 'Optimal batch: 2x 5kg tepung', generated_at: '2026-01-01' }],
      meta: { page: 1, limit, total: 1 },
    })),
    getSalesMetrics: vi.fn(async () => ({ total_sales: 100000 })),
    getTopProducts: vi.fn(async () => []),
    getProductionVariance: vi.fn(async () => []),
    getDashboardSummary: vi.fn(async () => ({ low_stock: { materials: 1, products: 0 } })),
    createInsight: vi.fn(async (pf: string, pt: string, content: unknown[], meta: unknown) => ({
      id: 'ins_new', summary: 'Rule-based: Batch 2x optimal', generated_at: '2026-01-01',
    })),
  };

  return {
    AUTH_DO: { idFromName: vi.fn(), get: vi.fn(() => ({ validateSession: vi.fn(async () => ({ userId: 'usr_01', tenantId: 'ten_01', sessionId: 'ses_01' })) })) } as unknown as DurableObjectNamespace,
    TENANT_DO: { idFromName: vi.fn(), get: vi.fn(() => mockTenantDo) } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('Insights routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => { c.env = env; await next(); });
    app.route('/api/v1/insights', insights);
  });

  it('POST /generate generates insights', async () => {
    const res = await app.request('/api/v1/insights/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ period_from: '2026-01-01', period_to: '2026-01-31' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('ins_new');
  });

  it('POST /generate returns 422 for missing period', async () => {
    const res = await app.request('/api/v1/insights/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });

  it('GET / returns paginated insights', async () => {
    const res = await app.request('/api/v1/insights', {
      headers: { Cookie: 'session_token=test' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});
