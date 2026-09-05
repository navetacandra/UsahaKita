import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const productions = new Hono<{ Bindings: Env }>();
productions.use('*', authMiddleware);

productions.post('/preview', async (c) => {
  const body = await c.req.json<{ product_id: string; target_output_quantity: number }>();
  const { product_id, target_output_quantity } = body;

  if (!product_id || !target_output_quantity || target_output_quantity <= 0) {
    return c.json(errorResponse('VALIDATION_ERROR', 'product_id and positive target_output_quantity required', 422), 422);
  }

  const tenantDo = getTenantDo(c);
  try {
    const preview = await tenantDo.previewProduction(product_id, target_output_quantity);
    return c.json(successResponse(preview));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg, 404), 404);
  }
});

productions.post('/', async (c) => {
  const body = await c.req.json<{
    product_id: string;
    bom_id: string;
    target_output_quantity: number;
    actual_output_quantity: number;
    materials: { material_id: string; calculated_quantity: number; actual_quantity: number }[];
    note?: string;
  }>();
  const { product_id, bom_id, target_output_quantity, actual_output_quantity, materials, note } = body;

  if (!product_id || !bom_id || !target_output_quantity || !actual_output_quantity || !materials?.length) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Missing required fields', 422), 422);
  }

  const tenantDo = getTenantDo(c);
  try {
    const production = await tenantDo.commitProduction(product_id, bom_id, target_output_quantity, actual_output_quantity, materials, note);
    return c.json(successResponse(production), 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    const status = msg === 'INSUFFICIENT_MATERIAL_STOCK' ? 409 : msg === 'BOM_PRODUCT_MISMATCH' ? 422 : 500;
    return c.json(errorResponse(msg, msg, status), status as 400);
  }
});

productions.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;
  const product_id = c.req.query('product_id') || undefined;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listProductions(page, limit, product_id);
  return c.json(successResponse(result.data, result.meta));
});

productions.get('/:id', async (c) => {
  const id = c.req.param('id');
  const tenantDo = getTenantDo(c);
  try {
    const production = await tenantDo.getProduction(id);
    return c.json(successResponse(production));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'RESOURCE_NOT_FOUND';
    return c.json(errorResponse(msg, msg, 404), 404);
  }
});

export default productions;
