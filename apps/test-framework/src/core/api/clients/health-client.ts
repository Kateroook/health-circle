import { BaseClient, ApiResult } from './base-client';

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
    return await this.get<HealthResponse>('/api/health');
  }
}
