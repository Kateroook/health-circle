import { APIResponse } from '@playwright/test';
import { expect as baseExpect } from '@playwright/test';
import { ApiResponseMeta } from '../../types/api';

const is = {
  status: (res: APIResponse, code: number) => res.status() === code,
  ok: (res: APIResponse) => res.ok(), // 2xx
  clientError: (res: APIResponse) => res.status() >= 400 && res.status() < 500,
  serverError: (res: APIResponse) => res.status() >= 500 && res.status() < 600,
  json: (res: APIResponse) => res.headers()['content-type']?.includes('application/json'),
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

const statusMatchers = {
  toHaveStatus(apiResponse: APIResponse, expectedStatus: number) {
    const pass = is.status(apiResponse, expectedStatus);
    return {
      pass,
      message: () =>
        pass
          ? `Expected response not with status ${expectedStatus}`
          : `Expected response with status ${expectedStatus}, but got ${apiResponse.status()}. Message: ${apiResponse.statusText()}`,
    };
  },
  toHaveStatus2xx(apiResponse: APIResponse) {
    const pass = is.ok(apiResponse);

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to be 2xx`
          : `Expected 2xx status but got ${apiResponse.status()}. Message: ${apiResponse.statusText()}`,
    };
  },

  toHaveStatus4xx(apiResponse: APIResponse) {
    const pass = is.clientError(apiResponse);

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to be 4xx`
          : `Expected 4xx status but got ${apiResponse.status()}. Message: ${apiResponse.statusText()}`,
    };
  },

  toHaveStatus5xx(apiResponse: APIResponse) {
    const pass = is.serverError(apiResponse);

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to be 5xx`
          : `Expected 5xx status but got ${apiResponse.status()}. Message: ${apiResponse.statusText()}`,
    };
  },

  toHaveJsonContent(apiResponse: APIResponse) {
    const contentType = apiResponse.headers()['content-type'] || '';
    const pass = is.json(apiResponse);

    return {
      pass,
      message: () => (pass ? `Expected response not to be JSON` : `Expected JSON response but got "${contentType}"`),
    };
  },
};

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toHaveStatus(apiResponse: APIResponse, expectedStatus: number): Promise<R>;
      toHaveStatus2xx(apiResponse: APIResponse): Promise<R>;
      toHaveStatus3xx(apiResponse: APIResponse): Promise<R>;
      toHaveStatus4xx(apiResponse: APIResponse): Promise<R>;
      toHaveStatus5xx(apiResponse: APIResponse): Promise<R>;
      toHaveJsonContent(apiResponse: APIResponse): Promise<R>;
    }
  }
}

export const expect = baseExpect.extend(statusMatchers);
