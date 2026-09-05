import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import business from '../routes/business';

function createMockEnv(): Env {
  const mockTenantDo = {
    getTenantInfo: vi.fn(async () => ({ id: 'ten_01', name: 'Toko Maju', description: 'Toko kelontong', created_at: '2026-01-01' })),
    updateTenant: vi.fn(async (name: string, desc: string) => ({ id: 'ten_01', name, description: desc, created_at: '2026-01-01' })),
    listMembers: vi.fn(async () => ({
      data: [{ tenant_id: 'ten_01', user_id: 'usr_01', user_email: 'owner@tokomaju.com', user_name: null, role: 'OWNER', created_at: '2026-01-01' }],
      meta: { page: 1, limit: 20, total: 1 },
    })),
  };

  return {
    AUTH_DO: {
      idFromName: vi.fn(),
      get: vi.fn(() => ({
        validateSession: vi.fn(async () => ({ userId: 'usr_01', tenantId: 'ten_01', sessionId: 'ses_01' })),
        getTenantById: vi.fn(async () => ({ id: 'ten_01', name: 'Toko Maju', description: 'Toko kelontong' })),
        updateTenant: vi.fn(async () => {}),
      })),
    } as unknown as DurableObjectNamespace,
    TENANT_DO: {
      idFromName: vi.fn(),
      get: vi.fn(() => mockTenantDo),
    } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('Business routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => { c.env = env; await next(); });
    app.route('/api/v1/business', business);
  });

  it('GET / returns business info', async () => {
    const res = await app.request('/api/v1/business', { headers: { Cookie: 'session_token=test' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Toko Maju');
  });

  it('PATCH / updates business info', async () => {
    const res = await app.request('/api/v1/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: 'session_token=test' },
      body: JSON.stringify({ name: 'Toko Baru', description: 'New desc' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
