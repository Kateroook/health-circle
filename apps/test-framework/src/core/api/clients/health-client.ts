import { runStep } from '../helpers/step-helper';
import { ApiResult, BaseClient } from './base-client';

export interface DatabaseInfo {
  status: string;
}

export interface HealthInfo {
  database: DatabaseInfo;
}

export interface HealthResponse {
  status: string;
  info: HealthInfo;
  details: Record<string, any>;
}

export class HealthClient extends BaseClient {
  public async getHealth(): Promise<ApiResult<HealthResponse>> {
    return await runStep('Get health', async () => {
      return this.get<HealthResponse>('/api/health');
    });
  }
}
