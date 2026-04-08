import { ApiResult, BaseClient } from './base-client';

// Додаємо інтерфейс для відповіді
export interface RollCallResponse {
  message: string;
}

export class RollCallClient extends BaseClient {
  public async initiateForGroup(groupId: string): Promise<ApiResult<RollCallResponse>> {
    return await this.post<RollCallResponse>(`/api/groups/${groupId}/roll-call`);
  }

  public async initiateForMember(groupId: string, userId: string): Promise<ApiResult<RollCallResponse>> {
    return await this.post<RollCallResponse>(`/api/groups/${groupId}/members/${userId}/roll-call`);
  }
}
