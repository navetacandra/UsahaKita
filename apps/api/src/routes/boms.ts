import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const boms = new Hono<{ Bindings: Env }>();
boms.use('*', authMiddleware);

boms.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;
  const search = c.req.query('search') || undefined;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listBoms(page, limit, search);
  return c.json(successResponse(result.data, result.meta));
});

boms.post('/', async (c) => {
  const body = await c.req.json<{
    name: string;
    product_id: string;
    output_quantity: number;
    output_unit: string;
    selling_price_per_unit: number;
    materials: { material_id: string; quantity: number }[];
  }>();
  const { name, product_id, output_quantity, output_unit, selling_price_per_unit, materials } = body;

  if (!name || !product_id || !output_quantity || !output_unit || !materials?.length) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Missing required fields'), 422);
  }

  const tenantDo = getTenantDo(c);
  try {
    const bom = await tenantDo.createBom(name, product_id, output_quantity, output_unit, selling_price_per_unit || 0, materials);
    return c.json(successResponse(bom), 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg), 422);
  }
});

boms.get('/:id', async (c) => {
  const id = c.req.param('id');
  const tenantDo = getTenantDo(c);
  try {
    const bom = await tenantDo.getBom(id);
    return c.json(successResponse(bom));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'RESOURCE_NOT_FOUND';
    return c.json(errorResponse(msg, msg), 404);
  }
});

boms.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    name?: string;
    output_quantity?: number;
    selling_price_per_unit?: number;
    materials?: { material_id: string; quantity: number }[];
  }>();

  const tenantDo = getTenantDo(c);
  try {
    const bom = await tenantDo.updateBom(id, body);
    return c.json(successResponse(bom));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg), 404);
  }
});

export default boms;
