import type { SuccessResponse, ErrorResponse } from '../types';

export function successResponse<T>(data: T, meta?: Record<string, unknown>, status = 200): Response {
  const body: SuccessResponse<T> = { success: true, data };
  if (meta && Object.keys(meta).length > 0) {
    body.meta = meta;
  }
  return Response.json(body, { status });
}

export function errorResponse(code: string, message: string, status = 400, fields?: Record<string, string>): Response {
  const body: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (fields) {
    body.error.fields = fields;
  }
  return Response.json(body, { status });
}

export function notFoundResponse(code = 'RESOURCE_NOT_FOUND', message = 'Resource not found'): Response {
  return errorResponse(code, message, 404);
}

export function validationErrorResponse(message: string, fields?: Record<string, string>): Response {
  return errorResponse('VALIDATION_ERROR', message, 422, fields);
}

export function unauthorizedResponse(message = 'Authentication required'): Response {
  return errorResponse('AUTH_REQUIRED', message, 401);
}

export function forbiddenResponse(message = 'Forbidden'): Response {
  return errorResponse('FORBIDDEN', message, 403);
}

export function conflictResponse(code: string, message: string): Response {
  return errorResponse(code, message, 409);
}

export function internalErrorResponse(message = 'Internal server error'): Response {
  return errorResponse('INTERNAL_ERROR', message, 500);
}
