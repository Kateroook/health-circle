import { BaseClient, ApiResult } from './base-client';
import {
  GetAllGroupsResponse,
  GetGroupResponse,
  CreateGroupRequest,
  CreateGroupResponse,
  UpdateGroupRequest,
  UpdateGroupResponse,
  JoinGroupRequest,
  RegenerateInviteResponse,
  GetBlockedUsersResponse,
} from '../../types/api';

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
    return await this.get<GetAllGroupsResponse>('/api/groups');
  }

  /**
   * GET /api/groups/{id}
   * Отримати групу за ID
   */
  public async getGroup(id: string): Promise<ApiResult<GetGroupResponse>> {
    return await this.get<GetGroupResponse>(`/api/groups/${id}`);
  }

  /**
   * POST /api/groups
   * Створити нову групу
   */
  public async createGroup(data: CreateGroupRequest): Promise<ApiResult<CreateGroupResponse>> {
    const result = await this.post<CreateGroupResponse>('/api/groups', {
      data,
    });

    // Автоматично зберігаємо ID створеної групи
    if (result.data && result.data.id) {
      this.updateContext({ groupId: result.data.id });
      this.dbCleaner?.add('group', result.data.id);
    }

    return result;
  }

  /**
   * PUT /api/groups
   * Оновити групу
   */
  public async updateGroup(data: UpdateGroupRequest): Promise<ApiResult<UpdateGroupResponse>> {
    return await this.put<UpdateGroupResponse>('/api/groups', { data });
  }

  /**
   * DELETE /api/groups/{id}
   * Видалити групу
   */
  public async deleteGroup(id: string): Promise<ApiResult<void>> {
    return await this.delete<void>(`/api/groups/${id}`);
  }

  /**
   * POST /api/groups/{id}/leave
   * Вийти з групи
   */
  public async leaveGroup(id: string): Promise<ApiResult<void>> {
    return await this.post<void>(`/api/groups/${id}/leave`);
  }

  /**
   * POST /api/groups/{id}/invite
   * Згенерувати новий код запрошення
   */
  public async regenerateInviteCode(id: string): Promise<ApiResult<RegenerateInviteResponse>> {
    return await this.post<RegenerateInviteResponse>(`/api/groups/${id}/invite`);
  }

  /**
   * POST /api/groups/join
   * Приєднатися до групи за кодом запрошення
   */
  public async joinGroup(data: JoinGroupRequest): Promise<ApiResult<void>> {
    return await this.post<void>('/api/groups/join', { data });
  }

  /**
   * GET /api/groups/{id}/blocked-users
   * Отримати список заблокованих користувачів
   */
  public async getBlockedUsers(id: string): Promise<ApiResult<GetBlockedUsersResponse>> {
    return await this.get<GetBlockedUsersResponse>(`/api/groups/${id}/blocked-users`);
  }

  /**
   * POST /api/groups/{id}/block/{userId}
   * Заблокувати користувача в групі
   */
  public async blockUser(groupId: string, userId: string): Promise<ApiResult<void>> {
    return await this.post<void>(`/api/groups/${groupId}/block/${userId}`);
  }

  /**
   * DELETE /api/groups/{id}/block/{userId}
   * Розблокувати користувача в групі
   */
  public async unblockUser(groupId: string, userId: string): Promise<ApiResult<void>> {
    return await this.delete<void>(`/api/groups/${groupId}/block/${userId}`);
  }
}
