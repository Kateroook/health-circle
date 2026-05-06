import {
  CreateGroupRequest,
  CreateGroupResponse,
  GetAllGroupsResponse,
  GetBlockedUsersResponse,
  GetGroupResponse,
  JoinGroupRequest,
  RegenerateInviteResponse,
  RollCallResponse,
  UpdateGroupRequest,
  UpdateGroupResponse,
} from '../../types/api';
import { runStep } from '../helpers/step-helper';
import { ApiResult, BaseClient } from './base-client';

/**
 * GroupClient - клієнт для роботи з Groups API
 * Пласка структура методів для простоти використання
 */
export class GroupClient extends BaseClient {
  /**
   * GET /api/groups
   * Отримати всі групи поточного користувача
   */
  public async getAllGroups(): Promise<ApiResult<GetAllGroupsResponse>> {
    return await runStep(`Get all user groups`, async () => {
      return this.get<GetAllGroupsResponse>('/api/groups');
    });
  }

  /**
   * GET /api/groups/{id}
   * Отримати групу за ID
   */
  public async getGroup(id: string): Promise<ApiResult<GetGroupResponse>> {
    return await runStep(`Get group by id: ${id}`, async () => {
      return this.get<GetGroupResponse>(`/api/groups/${id}`);
    });
  }

  /**
   * POST /api/groups
   * Створити нову групу
   */
  public async createGroup(data: CreateGroupRequest): Promise<ApiResult<CreateGroupResponse>> {
    return await runStep(`Create group with name: "${data.name}"`, async () => {
      const result = await this.post<CreateGroupResponse>('/api/groups', {
        data: { name: data.name },
      });

      // Автоматично зберігаємо ID створеної групи
      if (result.data && result.data.id) {
        this.updateContext({ groupId: result.data.id });
        this.dbCleaner?.add('group', result.data.id);
      }

      return result;
    });
  }

  /**
   * PUT /api/groups
   * Оновити групу
   */
  public async updateGroup(data: UpdateGroupRequest): Promise<ApiResult<UpdateGroupResponse>> {
    return await runStep(`Update group with name: "${data.name}"`, async () => {
      return this.put<UpdateGroupResponse>('/api/groups', { data });
    });
  }

  /**
   * DELETE /api/groups/{id}
   * Видалити групу
   */
  public async deleteGroup(id: string): Promise<ApiResult<void>> {
    return await runStep(`Delete group by id: ${id}`, async () => {
      return this.delete<void>(`/api/groups/${id}`);
    });
  }

  /**
   * POST /api/groups/{id}/leave
   * Вийти з групи
   */
  public async leaveGroup(id: string): Promise<ApiResult<void>> {
    return await runStep(`Leave group with id: ${id}`, async () => {
      return this.post<void>(`/api/groups/${id}/leave`);
    });
  }

  /**
   * POST /api/groups/{id}/invite
   * Згенерувати новий код запрошення
   */
  public async regenerateInviteCode(id: string): Promise<ApiResult<RegenerateInviteResponse>> {
    return await runStep(`Regenerate invite code for group with id: ${id}`, async () => {
      return this.post<RegenerateInviteResponse>(`/api/groups/${id}/invite`);
    });
  }

  /**
   * POST /api/groups/join
   * Приєднатися до групи за кодом запрошення
   */
  public async joinGroup(data: JoinGroupRequest): Promise<ApiResult<void>> {
    return await runStep(`Join group with invite code: "${data.code!}"`, async () => {
      return this.post<void>('/api/groups/join', { data });
    });
  }

  /**
   * GET /api/groups/{id}/blocked-users
   * Отримати список заблокованих користувачів
   */
  public async getBlockedUsers(id: string): Promise<ApiResult<GetBlockedUsersResponse>> {
    return await runStep(`Get blocked users for group with id: ${id}`, async () => {
      return this.get<GetBlockedUsersResponse>(`/api/groups/${id}/blocked-users`);
    });
  }

  /**
   * POST /api/groups/{id}/block/{userId}
   * Заблокувати користувача в групі
   */
  public async blockUser(groupId: string, userId: string): Promise<ApiResult<void>> {
    return await runStep(`Block user with id: ${userId} in group with id: ${groupId}`, async () => {
      return this.post<void>(`/api/groups/${groupId}/block/${userId}`);
    });
  }

  /**
   * DELETE /api/groups/{id}/block/{userId}
   * Розблокувати користувача в групі
   */
  public async unblockUser(groupId: string, userId: string): Promise<ApiResult<void>> {
    return await runStep(`Unblock user with id: ${userId} in group with id: ${groupId}`, async () => {
      return this.delete<void>(`/api/groups/${groupId}/block/${userId}`);
    });
  }

  /**
   * POST /api/groups/{id}/roll-call
   * Почати перекличку для групи
   */
  public async initiateGroupRollCall(groupId: string): Promise<ApiResult<RollCallResponse>> {
    return await runStep(`Initiate roll call for group with id: ${groupId}`, async () => {
      return this.post<RollCallResponse>(`/api/groups/${groupId}/roll-call`);
    });
  }
}
