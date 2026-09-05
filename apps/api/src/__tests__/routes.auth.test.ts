import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import auth from '../routes/auth';

function createMockEnv(): Env {
  const users = new Map<string, Record<string, unknown>>();
  const tenants = new Map<string, Record<string, unknown>>();
  const members = new Map<string, Record<string, unknown>>();
  const sessions = new Map<string, Record<string, unknown>>();

  const mockAuthDo = {
    createUser: vi.fn(async (email: string, password: string, name: string, desc: string) => {
      const userId = 'usr_test';
      const tenantId = 'ten_test';
      users.set(userId, { id: userId, email, password_hash: 'hash', password_salt: 'salt', created_at: '2026-01-01' });
      tenants.set(tenantId, { id: tenantId, name, description: desc, created_at: '2026-01-01', updated_at: '2026-01-01' });
      members.set(`${tenantId}:${userId}`, { tenant_id: tenantId, user_id: userId, role: 'OWNER', created_at: '2026-01-01' });
      return { user: { id: userId, email }, tenant: { id: tenantId, name, description: desc } };
    }),
    createSession: vi.fn(async (userId: string, tenantId: string) => {
      const sessionId = 'ses_test';
      const token = 'test-token-abc123';
      sessions.set(sessionId, { id: sessionId, user_id: userId, tenant_id: tenantId, token_hash: 'hash', expires_at: '2099-01-01', created_at: '2026-01-01', revoked_at: null });
      return { sessionId, token };
    }),
    verifyLogin: vi.fn(async (email: string, _password: string) => {
      for (const u of users.values()) {
        if (u.email === email) {
          return { user: { id: u.id as string, email: u.email as string }, tenant: { id: 'ten_test', name: 'Test Business', description: 'desc' } };
        }
      }
      return null;
    }),
    findUserById: vi.fn(async (id: string) => users.get(id) || null),
    getTenantById: vi.fn(async (id: string) => tenants.get(id) || null),
    revokeSession: vi.fn(async () => {}),
    seed: vi.fn(async (force: boolean) => ({ seeded: true, message: 'ok', counts: { users: 1 } })),
  };

  const mockTenantDo = {
    seed: vi.fn(async (force: boolean) => ({ seeded: true, message: 'ok', counts: { materials: 5 } })),
  };

  return {
    AUTH_DO: {
      idFromName: vi.fn(() => 'id-global'),
      get: vi.fn(() => mockAuthDo),
    } as unknown as DurableObjectNamespace,
    TENANT_DO: {
      idFromName: vi.fn(() => 'id-ten-01'),
      get: vi.fn(() => mockTenantDo),
    } as unknown as DurableObjectNamespace,
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  };
}

describe('Auth routes', () => {
  let app: Hono;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use('*', async (c, next) => {
      c.env = env;
      await next();
    });
    app.route('/api/v1/auth', auth);
  });

  describe('POST /register', () => {
    it('registers a new user and returns 201', async () => {
      const res = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123', business_name: 'Toko Test' }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.tenant.name).toBe('Toko Test');
      expect(res.headers.get('set-cookie')).toContain('session_token=');
    });

    it('returns 422 for missing fields', async () => {
      const res = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 422 for short password', async () => {
      const res = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'short', business_name: 'Toko' }),
      });
      expect(res.status).toBe(422);
    });

    it('returns 422 for invalid email', async () => {
      const res = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'password123', business_name: 'Toko' }),
      });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /login', () => {
    it('logs in with valid credentials', async () => {
      // First register
      await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123', business_name: 'Toko' }),
      });

      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(res.headers.get('set-cookie')).toContain('session_token=');
    });

    it('returns 401 for invalid credentials', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong' }),
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 422 for missing fields', async () => {
      const res = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /seed', () => {
    it('seeds the database', async () => {
      const res = await app.request('/api/v1/auth/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.auth.seeded).toBe(true);
      expect(body.data.tenant.seeded).toBe(true);
    });
  });
});
