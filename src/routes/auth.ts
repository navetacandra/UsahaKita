import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware, getSession } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/register', async (c) => {
  const body = await c.req.json<{ email: string; password: string; business_name: string; business_description?: string }>();
  const { email, password, business_name, business_description } = body;

  if (!email || !password || !business_name) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Email, password, and business name are required', 422), 422);
  }
  if (password.length < 8) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Password must be at least 8 characters', 422), 422);
  }
  if (!email.includes('@')) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Invalid email format', 422), 422);
  }

  const authDoId = c.env.AUTH_DO.idFromName('global');
  const authDo = c.env.AUTH_DO.get(authDoId);

  try {
    const result = await authDo.createUser(email, password, business_name, business_description || '');
    const session = await authDo.createSession(result.user.id, result.tenant.id);

    const cookie = `session_token=${session.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`;
    return c.json(successResponse(result), 201, { 'Set-Cookie': cookie });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    if (msg === 'EMAIL_ALREADY_EXISTS') {
      return c.json(errorResponse('EMAIL_ALREADY_EXISTS', 'Email already registered', 409), 409);
    }
    return c.json(errorResponse('INTERNAL_ERROR', msg, 500), 500);
  }
});

auth.post('/login', async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Email and password are required', 422), 422);
  }

  const authDoId = c.env.AUTH_DO.idFromName('global');
  const authDo = c.env.AUTH_DO.get(authDoId);

  const result = await authDo.verifyLogin(email, password);
  if (!result) {
    return c.json(errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401), 401);
  }

  const session = await authDo.createSession(result.user.id, result.tenant.id);
  const cookie = `session_token=${session.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`;
  return c.json(successResponse(result), 200, { 'Set-Cookie': cookie });
});

auth.get('/me', authMiddleware, async (c) => {
  const session = getSession(c);
  const authDoId = c.env.AUTH_DO.idFromName('global');
  const authDo = c.env.AUTH_DO.get(authDoId);

  const user = await authDo.findUserById(session.userId);
  const tenant = await authDo.getTenantById(session.tenantId);

  if (!user || !tenant) {
    return c.json(errorResponse('RESOURCE_NOT_FOUND', 'User or tenant not found', 404), 404);
  }

  return c.json(successResponse({
    user: { id: user.id, email: user.email },
    business: { id: tenant.id, name: tenant.name, description: tenant.description },
  }));
});

auth.post('/logout', authMiddleware, async (c) => {
  const session = getSession(c);
  const authDoId = c.env.AUTH_DO.idFromName('global');
  const authDo = c.env.AUTH_DO.get(authDoId);

  await authDo.revokeSession(session.sessionId);

  return c.json(successResponse(null), 200, {
    'Set-Cookie': 'session_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
  });
});

auth.post('/seed', async (c) => {
  const authDoId = c.env.AUTH_DO.idFromName('global');
  const authDo = c.env.AUTH_DO.get(authDoId);

  const authResult = await authDo.seed();

  const tenantDoId = c.env.TENANT_DO.idFromName('ten_01');
  const tenantDo = c.env.TENANT_DO.get(tenantDoId);
  const tenantResult = await tenantDo.seed();

  return c.json(successResponse({
    auth: authResult,
    tenant: tenantResult,
  }));
});

export default auth;
