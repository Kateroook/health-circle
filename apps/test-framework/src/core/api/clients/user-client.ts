import { test } from '../../../api/fixtures/api-fixture';
import {
  CreateUserRequest,
  CreateUserResponse,
  GetUserResponse,
  ModifyUserRequest,
  ModifyUserResponse,
  SaveFcmTokenResponse,
  UpdateUserStatusRequest,
  UpdateUserStatusResponse,
  UploadUserAvatarResponse,
} from '../../types/api';
import { ApiResult, BaseClient } from './base-client';

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
  public async uploadUserAvatar(
    id: string,
    file: { buffer: Buffer; filename: string; mimeType: string },
  ): Promise<ApiResult<UploadUserAvatarResponse>> {
    const boundary = `----FormBoundary${Date.now()}`;

    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${file.filename}"\r\n` +
          `Content-Type: ${file.mimeType}\r\n\r\n`,
      ),
      file.buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    return await this.put<UploadUserAvatarResponse>(`/api/users/${id}/avatar`, {
      data: body,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        accept: 'application/json',
      },
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
      const result = await this.post<CreateUserResponse>('/api/users', {
        data: {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
      });
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
    return await this.put<ModifyUserResponse>('/api/users', {
      data: {
        id: data.id,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        alertRegionUid: (data as any).alertRegionUid,
      },
    });
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
