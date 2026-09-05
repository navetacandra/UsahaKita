import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware, getSession } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const business = new Hono<{ Bindings: Env }>();
business.use('*', authMiddleware);

business.get('/', async (c) => {
  const session = getSession(c);
  const authDoId = c.env.AUTH_DO.idFromName('global');
  const authDo = c.env.AUTH_DO.get(authDoId);

  const tenant = await authDo.getTenantById(session.tenantId);
  if (!tenant) {
    return c.json(errorResponse('RESOURCE_NOT_FOUND', 'Business not found', 404), 404);
  }

  return c.json(successResponse({
    id: tenant.id,
    name: tenant.name,
    description: tenant.description,
  }));
});

business.patch('/', async (c) => {
  const session = getSession(c);
  const body = await c.req.json<{ name?: string; description?: string }>();

  const authDoId = c.env.AUTH_DO.idFromName('global');
  const authDo = c.env.AUTH_DO.get(authDoId);

  await authDo.updateTenant(session.tenantId, body.name, body.description);

  const tenant = await authDo.getTenantById(session.tenantId);
  return c.json(successResponse({
    id: tenant!.id,
    name: tenant!.name,
    description: tenant!.description,
  }));
});

export default business;
