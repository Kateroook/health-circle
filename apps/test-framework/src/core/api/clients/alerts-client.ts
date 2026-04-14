import { AlertsRegionEntity, MyAlertStatusDto } from '@core/types/entites/alerts-interface';
import { APIRequestContext } from '@playwright/test';
import { TestContext } from '../helpers/test-context';
import { ApiResult, BaseClient } from './base-client'; // Підстав свій шлях

export class AlertsClient extends BaseClient {
  constructor(request: APIRequestContext, context: TestContext) {
    // baseUrl підтягнеться автоматично з BaseClient (з process.env.API_BASE_URL)
    super(request, context);
  }

  /**
   * Отримує масив UID поточних активних тривог
   */
  async getActiveAlerts(): Promise<ApiResult<number[]>> {
    return this.get<number[]>('/api/alerts/active');
  }

  /**
   * Тригерить мануальну синхронізацію тривог на бекенді
   */
  async triggerSync(): Promise<ApiResult<void>> {
    return this.post<void>('/api/alerts/trigger-sync');
  }

  /**
   * Отримує ієрархічний список усіх регіонів
   */
  async getRegions(): Promise<ApiResult<AlertsRegionEntity[]>> {
    return this.get<AlertsRegionEntity[]>('/api/alerts/regions');
  }

  /**
   * Отримує статус тривоги для поточного авторизованого користувача
   */
  async getMyAlertStatus(): Promise<ApiResult<MyAlertStatusDto>> {
    return this.get<MyAlertStatusDto>('/api/alerts/status');
  }
}
