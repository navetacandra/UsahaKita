import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const sales = new Hono<{ Bindings: Env }>();
sales.use('*', authMiddleware);

sales.post('/', async (c) => {
  const body = await c.req.json<{ items: { product_id: string; quantity: number }[] }>();
  const { items } = body;

  if (!items?.length) {
    return c.json(errorResponse('VALIDATION_ERROR', 'At least one item is required', 422), 422);
  }

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity <= 0) {
      return c.json(errorResponse('VALIDATION_ERROR', 'Each item needs product_id and positive quantity', 422), 422);
    }
  }

  const tenantDo = getTenantDo(c);
  try {
    const sale = await tenantDo.commitSale(items);
    return c.json(successResponse(sale), 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg, 409), 409);
  }
});

sales.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;
  const from = c.req.query('from') || undefined;
  const to = c.req.query('to') || undefined;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listSales(page, limit, from, to);
  return c.json(successResponse(result.data, result.meta));
});

export default sales;
