import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const products = new Hono<{ Bindings: Env }>();
products.use('*', authMiddleware);

products.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;
  const search = c.req.query('search') || undefined;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listProducts(page, limit, search);
  return c.json(successResponse(result.data, result.meta));
});

products.post('/', async (c) => {
  const body = await c.req.json<{ name: string; unit: string; minimum_stock?: number }>();
  const { name, unit, minimum_stock } = body;

  if (!name || !unit) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Name and unit are required'), 422);
  }

  const tenantDo = getTenantDo(c);
  const product = await tenantDo.createProduct(name, unit, minimum_stock || 0);
  return c.json(successResponse(product), 201);
});

products.post('/:id/outgoing', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ quantity: number; reason_type: string; reason_note?: string }>();
  const { quantity, reason_type, reason_note } = body;

  if (!quantity || quantity <= 0 || !reason_type) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Positive quantity and reason_type are required'), 422);
  }

  const tenantDo = getTenantDo(c);
  try {
    const movement = await tenantDo.createProductOutgoing(id, quantity, reason_type, reason_note);
    return c.json(successResponse(movement), 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg), 409);
  }
});

products.get('/:id/movements', async (c) => {
  const id = c.req.param('id');
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 50;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listProductMovements(id, page, limit);
  return c.json(successResponse(result.data, result.meta));
});

products.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const tenantDo = getTenantDo(c);
  try {
    await tenantDo.hideProduct(id);
    return c.json(successResponse({ deleted: true }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg), 404);
  }
});

products.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ name?: string; unit?: string; minimum_stock?: number; selling_price?: number }>();
  const tenantDo = getTenantDo(c);
  try {
    const product = await tenantDo.updateProduct(id, body);
    return c.json(successResponse(product));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg), 404);
  }
});

export default products;
