import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const stockOpname = new Hono<{ Bindings: Env }>();
stockOpname.use('*', authMiddleware);

stockOpname.post('/', async (c) => {
  const body = await c.req.json<{ item_type: string; item_id: string; actual_quantity: number; note?: string }>();
  const { item_type, item_id, actual_quantity, note } = body;

  if (!item_type || !item_id || actual_quantity === undefined) {
    return c.json(errorResponse('VALIDATION_ERROR', 'item_type, item_id, and actual_quantity are required'), 422);
  }
  if (item_type !== 'MATERIAL' && item_type !== 'PRODUCT') {
    return c.json(errorResponse('VALIDATION_ERROR', 'item_type must be MATERIAL or PRODUCT'), 422);
  }

  const tenantDo = getTenantDo(c);
  try {
    const opname = await tenantDo.createStockOpname(item_type, item_id, actual_quantity, note);
    return c.json(successResponse(opname), 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg), 404);
  }
});

stockOpname.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listStockOpnames(page, limit);
  return c.json(successResponse(result.data, result.meta));
});

export default stockOpname;
