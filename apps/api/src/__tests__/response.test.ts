import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  internalErrorResponse,
} from '../lib/response';

describe('successResponse', () => {
  it('wraps data with success: true', () => {
    const res = successResponse({ id: 1 });
    expect(res).toEqual({ success: true, data: { id: 1 } });
  });

  it('includes meta when provided and non-empty', () => {
    const res = successResponse([], { page: 1, total: 5 });
    expect(res.meta).toEqual({ page: 1, total: 5 });
  });

  it('omits meta when empty', () => {
    const res = successResponse('hello');
    expect(res).not.toHaveProperty('meta');
  });

  it('works with null data', () => {
    const res = successResponse(null);
    expect(res).toEqual({ success: true, data: null });
  });
});

describe('errorResponse', () => {
  it('returns error with code and message', () => {
    const res = errorResponse('NOT_FOUND', 'Item missing');
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item missing' },
    });
  });

  it('includes fields when provided', () => {
    const res = errorResponse('VALIDATION_ERROR', 'Bad input', { email: 'required' });
    expect(res.error.fields).toEqual({ email: 'required' });
  });

  it('omits fields when not provided', () => {
    const res = errorResponse('ERROR', 'msg');
    expect(res.error).not.toHaveProperty('fields');
  });
});

describe('convenience response helpers', () => {
  it('notFoundResponse returns RESOURCE_NOT_FOUND', () => {
    const res = notFoundResponse();
    expect(res.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('notFoundResponse accepts custom code', () => {
    const res = notFoundResponse('CUSTOM_CODE', 'nope');
    expect(res.error.code).toBe('CUSTOM_CODE');
    expect(res.error.message).toBe('nope');
  });

  it('validationErrorResponse returns VALIDATION_ERROR', () => {
    const res = validationErrorResponse('required field');
    expect(res.error.code).toBe('VALIDATION_ERROR');
    expect(res.error.message).toBe('required field');
  });

  it('validationErrorResponse includes fields', () => {
    const res = validationErrorResponse('bad', { name: 'required' });
    expect(res.error.fields).toEqual({ name: 'required' });
  });

  it('unauthorizedResponse returns AUTH_REQUIRED', () => {
    const res = unauthorizedResponse();
    expect(res.error.code).toBe('AUTH_REQUIRED');
  });

  it('unauthorizedResponse accepts custom message', () => {
    const res = unauthorizedResponse('token expired');
    expect(res.error.message).toBe('token expired');
  });

  it('forbiddenResponse returns FORBIDDEN', () => {
    const res = forbiddenResponse();
    expect(res.error.code).toBe('FORBIDDEN');
  });

  it('conflictResponse returns given code', () => {
    const res = conflictResponse('DUPLICATE', 'already exists');
    expect(res.error.code).toBe('DUPLICATE');
  });

  it('internalErrorResponse returns INTERNAL_ERROR', () => {
    const res = internalErrorResponse();
    expect(res.error.code).toBe('INTERNAL_ERROR');
  });
});
