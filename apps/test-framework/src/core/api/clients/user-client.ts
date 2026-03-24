import { BaseClient, ApiResult } from './base-client';
import {
  GetUserResponse,
  CreateUserRequest,
  CreateUserResponse,
  ModifyUserRequest,
  ModifyUserResponse,
  UpdateUserStatusRequest,
  UpdateUserStatusResponse,
  SaveFcmTokenResponse,
  UploadUserAvatarResponse,
} from '../../types/api';
import { checkResponse } from '../helpers/response-checker';
import { test } from '../../../api/fixtures/api-fixture';

/**
 * UserClient - клієнт для роботи з Users API
 * Пласка структура методів для простоти використання
 */
export class UserClient extends BaseClient {
  /**
   * GET /api/users/{id}
   * Отримати користувача за ID
   */
  public async getUser(id: string): Promise<ApiResult<GetUserResponse>> {
    return await this.get<GetUserResponse>(`/api/users/${id}`);
  }

  /**
   * GET /api/users/{id}/avatar
   * Отримати аватар користувача
   */
  public async getUserAvatar(id: string): Promise<ApiResult<Buffer>> {
    return await this.get<Buffer>(`/api/users/${id}/avatar`);
  }

  /**
   * PUT /api/users/{id}/avatar
   * Завантажити аватар користувача
   */
  public async uploadUserAvatar(id: string, file: Buffer | Blob): Promise<ApiResult<UploadUserAvatarResponse>> {
    const formData = new FormData();

    if (Buffer.isBuffer(file)) {
      const uint8 = new Uint8Array(file);
      formData.append('file', new Blob([uint8]));
    } else {
      formData.append('file', file);
    }

    return await this.put<UploadUserAvatarResponse>(`/api/users/${id}/avatar`, {
      multipart: formData,
      headers: {}, // Без Content-Type для multipart
    });
  }

  /**
   * DELETE /api/users/{id}/avatar
   * Видалити аватар користувача
   */
  public async deleteUserAvatar(id: string): Promise<ApiResult<void>> {
    return await this.delete<void>(`/api/users/${id}/avatar`);
  }

  /**
   * PATCH /api/users/{id}/reset-password
   * Скинути пароль користувача
   */
  public async resetUserPassword(id: string): Promise<ApiResult<void>> {
    return await this.patch<void>(`/api/users/${id}/reset-password`);
  }

  /**
   * POST /api/users
   * Створити нового користувача
   */
  public async createUser(data: CreateUserRequest): Promise<ApiResult<CreateUserResponse>> {
    return test.step(`Create user. FirstName: "${data.firstName}", LastName: "${data.lastName}", Phone: "${data.phone}", Email: "${data.email}"`, async () => {
      const result = await this.post<CreateUserResponse>('/api/users', { data });
      if (result.data && result.data.id) {
        this.dbCleaner?.add('users', result.data.id);
      }
      return result;
    });
  }

  /**
   * PUT /api/users
   * Модифікувати користувача
   */
  public async modifyUser(data: ModifyUserRequest): Promise<ApiResult<ModifyUserResponse>> {
    return await this.put<ModifyUserResponse>('/api/users', { data });
  }

  /**
   * DELETE /api/users
   * Видалити автентифікованого користувача
   */
  public async deleteUser(): Promise<ApiResult<void>> {
    return await this.delete<void>('/api/users');
  }

  /**
   * PUT /api/users/status
   * Оновити статус користувача
   */
  public async updateUserStatus(data: UpdateUserStatusRequest): Promise<ApiResult<UpdateUserStatusResponse>> {
    return await this.put<UpdateUserStatusResponse>('/api/users/status', {
      data,
    });
  }

  /**
   * PUT /api/users/fcm-token
   * Зберегти FCM токен користувача
   */
  public async saveFcmToken(token: string): Promise<ApiResult<SaveFcmTokenResponse>> {
    return await this.put<SaveFcmTokenResponse>('/api/users/fcm-token', {
      data: { token },
    });
  }
}
