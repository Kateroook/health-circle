import { APIResponse } from '@playwright/test';
import { expect } from '@playwright/test';
import { ApiResponseMeta } from '../../types/api';

const is = {
  status: (res: APIResponse, code: number) => res.status() === code,
  ok: (res: APIResponse) => res.ok(), // 2xx
  clientError: (res: APIResponse) => res.status() >= 400 && res.status() < 500,
  serverError: (res: APIResponse) => res.status() >= 500 && res.status() < 600,
  json: (res: APIResponse) => res.headers()['content-type']?.includes('application/json'),
};

/**
 * Скорочені версії expectResponse для швидкого використання
 */
export const assertResponse = {
  is2xx: (res: APIResponse) => expect(is.ok(res), `Expected 2xx status, got ${res.status()}`).toBeTruthy(),
  is200: (res: APIResponse) => expect(res.status(), `Expected 200, got ${res.status()}`).toBe(200),
  is201: (res: APIResponse) => expect(res.status(), `Expected 201, got ${res.status()}`).toBe(201),
  is204: (res: APIResponse) => expect(res.status(), `Expected 204, got ${res.status()}`).toBe(204),
  is4xx: (res: APIResponse) => expect(is.clientError(res), `Expected 4xx status, got ${res.status()}`).toBeTruthy(),
  is400: (res: APIResponse) => expect(res.status(), `Expected 400, got ${res.status()}`).toBe(400),
  is401: (res: APIResponse) => expect(res.status(), `Expected 401, got ${res.status()}`).toBe(401),
  is403: (res: APIResponse) => expect(res.status(), `Expected 403, got ${res.status()}`).toBe(403),
  is404: (res: APIResponse) => expect(res.status(), `Expected 404, got ${res.status()}`).toBe(404),
  is5xx: (res: APIResponse) => expect(is.serverError(res), `Expected 5xx status, got ${res.status()}`).toBeTruthy(),
  is500: (res: APIResponse) => expect(res.status(), `Expected 500, got ${res.status()}`).toBe(500),
  status: (res: APIResponse, status: number) =>
    expect(res.status(), `Expected ${status}, got ${res.status()}`).toBe(status),
  json: (res: APIResponse) => expect(is.json(res), `Expected content type to be json`).toBeTruthy(),
};
/**
 * Скорочені версії для швидкого використання
 */
export const checkResponse = {
  is2xx: is.ok,
  is200: (res: APIResponse) => is.status(res, 200),
  is201: (res: APIResponse) => is.status(res, 201),
  is204: (res: APIResponse) => is.status(res, 204),
  is4xx: is.clientError,
  is400: (res: APIResponse) => is.status(res, 400),
  is401: (res: APIResponse) => is.status(res, 401),
  is403: (res: APIResponse) => is.status(res, 403),
  is404: (res: APIResponse) => is.status(res, 404),
  is5xx: is.serverError,
  is500: (res: APIResponse) => is.status(res, 500),
  status: is.status,
  json: is.json,
};
