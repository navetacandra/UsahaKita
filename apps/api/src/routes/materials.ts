import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const materials = new Hono<{ Bindings: Env }>();
materials.use('*', authMiddleware);

materials.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 20;
  const search = c.req.query('search') || undefined;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listMaterials(page, limit, search);
  return c.json(successResponse(result.data, result.meta));
});

materials.post('/', async (c) => {
  const body = await c.req.json<{ name: string; unit: string; quantity_precision?: number; minimum_stock?: number }>();
  const { name, unit, quantity_precision, minimum_stock } = body;

  if (!name || !unit) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Name and unit are required'), 422);
  }

  const tenantDo = getTenantDo(c);
  const material = await tenantDo.createMaterial(name, unit, quantity_precision || 0, minimum_stock || 0);
  return c.json(successResponse(material), 201);
});

materials.post('/:id/movements', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{ type: string; quantity: number; reason_type?: string; reason_note?: string }>();
  const { type, quantity, reason_type, reason_note } = body;

  if (!type || !quantity || quantity <= 0) {
    return c.json(errorResponse('VALIDATION_ERROR', 'Type and positive quantity are required'), 422);
  }
  if (type !== 'IN' && type !== 'OUT') {
    return c.json(errorResponse('VALIDATION_ERROR', 'Type must be IN or OUT'), 422);
  }

  const tenantDo = getTenantDo(c);
  try {
    const movement = await tenantDo.createMaterialMovement(id, type, quantity, reason_type, reason_note);
    return c.json(successResponse(movement), 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'INTERNAL_ERROR';
    return c.json(errorResponse(msg, msg), 409);
  }
});

materials.get('/:id/movements', async (c) => {
  const id = c.req.param('id');
  const page = Number(c.req.query('page')) || 1;
  const limit = Number(c.req.query('limit')) || 50;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listMaterialMovements(id, page, limit);
  return c.json(successResponse(result.data, result.meta));
});

export default materials;
