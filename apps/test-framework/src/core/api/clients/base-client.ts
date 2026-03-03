import { APIRequestContext, APIResponse } from '@playwright/test';
import { TestContext } from '../helpers/test-context';
import { config } from '../../../api/helpers/config';
import { DbCleaner } from '../../db/db-cleaner';

/**
 * Результат API запиту з типізованими даними
 */
export interface ApiResult<T = any> {
  data: T;
  response: APIResponse;
}

/**
 * BaseClient - базовий клас для всіх API-клієнтів
 * Надає методи для виконання HTTP-запитів з автоматичною авторизацією
 */
export abstract class BaseClient {
  protected request: APIRequestContext;
  protected context: TestContext;
  protected baseURL: string;
  protected dbCleaner?: DbCleaner;

  constructor(request: APIRequestContext, context: TestContext, dbCleaner?: DbCleaner) {
    this.request = request;
    this.context = context;
    this.baseURL = config.baseApiUrl;
    this.dbCleaner = dbCleaner;
  }

  /**
   * Отримує заголовки для запиту з авторизацією (якщо є токен)
   */
  protected getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.context.accessToken) {
      headers['Authorization'] = `Bearer ${this.context.accessToken}`;
    }

    return headers;
  }

  /**
   * Безпечно парсить JSON з відповіді
   * Повертає null якщо response не ok або body порожній
   */
  protected async safeJsonParse<T = any>(response: APIResponse): Promise<T | null> {
    if (!response.ok()) {
      return null;
    }

    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return null;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      return null;
    }
  }

  /**
   * GET запит з типізованою відповіддю
   */
  protected async get<T = any>(
    endpoint: string,
    options?: {
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<ApiResult<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options?.headers);

    const response = await this.request.get(url, {
      headers,
      params: options?.params,
      timeout: options?.timeout,
    });

    const data = await this.safeJsonParse<T>(response);
    return { data: data as T, response };
  }

  /**
   * POST запит з типізованою відповіддю
   */
  protected async post<T = any>(
    endpoint: string,
    options?: {
      data?: any;
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      multipart?: any;
      timeout?: number;
    },
  ): Promise<ApiResult<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options?.headers);

    const response = await this.request.post(url, {
      headers,
      data: options?.data,
      params: options?.params,
      multipart: options?.multipart,
      timeout: options?.timeout,
    });

    const data = await this.safeJsonParse<T>(response);
    return { data: data as T, response };
  }

  /**
   * PUT запит з типізованою відповіддю
   */
  protected async put<T = any>(
    endpoint: string,
    options?: {
      data?: any;
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      multipart?: any;
      timeout?: number;
    },
  ): Promise<ApiResult<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options?.headers);

    const response = await this.request.put(url, {
      headers,
      data: options?.data,
      params: options?.params,
      multipart: options?.multipart,
      timeout: options?.timeout,
    });

    const data = await this.safeJsonParse<T>(response);
    return { data: data as T, response };
  }

  /**
   * PATCH запит з типізованою відповіддю
   */
  protected async patch<T = any>(
    endpoint: string,
    options?: {
      data?: any;
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<ApiResult<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options?.headers);

    const response = await this.request.patch(url, {
      headers,
      data: options?.data,
      params: options?.params,
      timeout: options?.timeout,
    });

    const data = await this.safeJsonParse<T>(response);
    return { data: data as T, response };
  }

  /**
   * DELETE запит з типізованою відповіддю
   */
  protected async delete<T = any>(
    endpoint: string,
    options?: {
      params?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      timeout?: number;
    },
  ): Promise<ApiResult<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options?.headers);

    const response = await this.request.delete(url, {
      headers,
      params: options?.params,
      timeout: options?.timeout,
    });

    const data = await this.safeJsonParse<T>(response);
    return { data: data as T, response };
  }

  /**
   * Оновлює access token в контексті
   */
  public setAccessToken(token: string): void {
    this.context.accessToken = token;
  }

  /**
   * Оновлює refresh token в контексті
   */
  public setRefreshToken(token: string): void {
    this.context.refreshToken = token;
  }

  /**
   * Очищує токени
   */
  public clearTokens(): void {
    this.context.accessToken = undefined;
    this.context.refreshToken = undefined;
  }

  /**
   * Отримує поточний TestContext
   */
  public getContext(): TestContext {
    return this.context;
  }

  /**
   * Оновлює TestContext
   */
  public updateContext(updates: Partial<TestContext>): void {
    Object.assign(this.context, updates);
  }
}
