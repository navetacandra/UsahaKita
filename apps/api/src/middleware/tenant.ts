import { Context, Next } from 'hono';
import type { Env } from '../types';
import { internalErrorResponse } from '../lib/response';
import { getSession } from './auth';

export async function errorHandler(c: Context<{ Bindings: Env }>, next: Next) {
  try {
    await next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const codeMap: Record<string, number> = {
      EMAIL_ALREADY_EXISTS: 409,
      INVALID_CREDENTIALS: 401,
      RESOURCE_NOT_FOUND: 404,
      MATERIAL_NOT_FOUND: 404,
      PRODUCT_NOT_FOUND: 404,
      BOM_NOT_FOUND: 404,
      BOM_PRODUCT_MISMATCH: 422,
      INSUFFICIENT_MATERIAL_STOCK: 409,
      INSUFFICIENT_PRODUCT_STOCK: 409,
      VALIDATION_ERROR: 422,
      AUTH_REQUIRED: 401,
    };
    const status = codeMap[message] || 500;
    return c.json({
      success: false,
      error: { code: message, message },
    }, status as 400);
  }
}

export function getTenantDo(c: Context<{ Bindings: Env }>) {
  const session = getSession(c);
  const doId = c.env.TENANT_DO.idFromName(session.tenantId);
  return c.env.TENANT_DO.get(doId);
}
