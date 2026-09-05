import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const dashboard = new Hono<{ Bindings: Env }>();
dashboard.use('*', authMiddleware);

dashboard.get('/summary', async (c) => {
  const from = c.req.query('from') || undefined;
  const to = c.req.query('to') || undefined;

  const tenantDo = getTenantDo(c);
  const summary = await tenantDo.getDashboardSummary(from, to);
  return c.json(successResponse(summary));
});

export default dashboard;
