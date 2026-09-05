import type { SuccessResponse, ErrorResponse } from '../types';

export function successResponse<T>(data: T, meta?: Record<string, unknown>): SuccessResponse<T> {
  const body: SuccessResponse<T> = { success: true, data };
  if (meta && Object.keys(meta).length > 0) {
    body.meta = meta;
  }
  return body;
}

export function errorResponse(code: string, message: string, fields?: Record<string, string>): ErrorResponse {
  const body: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (fields) {
    body.error.fields = fields;
  }
  return body;
}

export function notFoundResponse(code = 'RESOURCE_NOT_FOUND', message = 'Resource not found'): ErrorResponse {
  return errorResponse(code, message);
}

export function validationErrorResponse(message: string, fields?: Record<string, string>): ErrorResponse {
  return errorResponse('VALIDATION_ERROR', message, fields);
}

export function unauthorizedResponse(message = 'Authentication required'): ErrorResponse {
  return errorResponse('AUTH_REQUIRED', message);
}

export function forbiddenResponse(message = 'Forbidden'): ErrorResponse {
  return errorResponse('FORBIDDEN', message);
}

export function conflictResponse(code: string, message: string): ErrorResponse {
  return errorResponse(code, message);
}

export function internalErrorResponse(message = 'Internal server error'): ErrorResponse {
  return errorResponse('INTERNAL_ERROR', message);
}
