// tests/clients/mocks/alerts-mock.client.ts

import { APIRequestContext } from '@playwright/test';
import { AlertRegion } from '../../data/regions';
import { TestContext } from './../helpers/test-context';
import { ApiResult, BaseClient } from './base-client';

export class AlertsMockClient extends BaseClient {
  constructor(request: APIRequestContext, context: TestContext) {
    const mockUrl = process.env.MOCK_ADMIN_URL || 'http://localhost:3001/__admin';
    super(request, context, undefined, mockUrl);
  }

  protected getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
  }

  /**
   * Вмикає тривогу
   * Приймає повний об'єкт AlertRegion
   */
  async startAlert(region: AlertRegion, alertType: string = 'air_raid'): Promise<ApiResult> {
    return this.post('/start', {
      data: {
        locationUid: region.uid,
        locationTitle: region.title,
        alertType: alertType,
      },
    });
  }

  /**
   * Вимикає тривогу
   * Приймає той самий тип аргументу, що й startAlert
   */
  async stopAlert(region: AlertRegion): Promise<ApiResult> {
    return this.post('/stop', {
      data: { locationUid: region.uid },
    });
  }

  async resetAll(): Promise<ApiResult> {
    return this.post('/reset');
  }
}
