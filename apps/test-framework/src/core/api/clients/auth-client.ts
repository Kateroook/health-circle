import { BaseClient, ApiResult } from './base-client';
import {
  LoginRequest,
  LoginResponse,
  SetupPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ProfileResponse,
} from '../../types/api';
import { checkResponse } from '../helpers/response-checker';

/**
 * AuthClient - клієнт для роботи з Auth API
 * Пласка структура методів для простоти використання
 */
export class AuthClient extends BaseClient {
  /**
   * POST /api/auth/login
   * Вхід користувача з автоматичним збереженням токенів
   */
  public async login(data: LoginRequest): Promise<ApiResult<LoginResponse>> {
    const result = await this.post<LoginResponse>('/api/auth/login', { data });

    // Автоматично зберігаємо токени
    if (checkResponse.is2xx(result.response)) {
      this.setAccessToken(result.data.accessToken!);
      this.setRefreshToken(result.data.refreshToken!);
    }

    return result;
  }

  /**
   * POST /api/auth/logout
   * Вихід користувача з автоматичним очищенням токенів
   */
  public async logout(): Promise<ApiResult<void>> {
    const result = await this.post<void>('/api/auth/logout');

    // Очищаємо токени після логауту
    this.clearTokens();

    return result;
  }

  /**
   * POST /api/auth/refresh
   * Оновити access token
   */
  public async refreshToken(
    {
      customToken,
      noToken = false,
    }: {
      customToken?: string;
      noToken?: boolean;
    } = {}
  ): Promise<ApiResult<LoginResponse>> {

    const oldAccessToken = this.context.accessToken;

    const token = customToken ?? this.context.refreshToken;

    const result = await this.post<LoginResponse>('/api/auth/refresh', {
      headers: noToken ? {} : { Authorization: `Bearer ${token}` },
    });

    if (result.response.ok()) {
      const accessToken = result.data.accessToken;
      const refreshToken = result.data.refreshToken;

      if (accessToken) this.setAccessToken(accessToken);
      if (refreshToken) this.setRefreshToken(refreshToken);
    } else {
      if (oldAccessToken) {
        this.setAccessToken(oldAccessToken);
      }
    }

    return result;
  }
  /**
   * GET /api/auth/profile
   * Отримати профіль користувача
   */
  public async getProfile(): Promise<ApiResult<ProfileResponse>> {
    return await this.get<ProfileResponse>('/api/auth/profile');
  }

  /**
   * POST /api/auth/password-setup
   * Встановити новий пароль
   */
  public async setupPassword(
    email: string,
    code: string,
    body: SetupPasswordRequest['body'],
  ): Promise<ApiResult<void>> {
    return await this.post<void>('/api/auth/password-setup', {
      params: { email, code },
      data: body,
    });
  }

  /**
   * POST /api/auth/change-password
   * Змінити пароль (авторизований)
   */
  public async changePassword(data: ChangePasswordRequest): Promise<ApiResult<void>> {
    return await this.post<void>('/api/auth/change-password', { data });
  }

  /**
   * POST /api/auth/forgot-password
   * Запитати код скидання пароля
   */
  public async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResult<void>> {
    return await this.post<void>('/api/auth/forgot-password', { data });
  }

  /**
   * POST /api/auth/reset-password
   * Скинути пароль за кодом
   */
  public async resetPassword(
    email: string,
    code: string,
    body: ResetPasswordRequest['body'],
  ): Promise<ApiResult<void>> {
    return await this.post<void>('/api/auth/reset-password', {
      params: { email, code },
      data: body,
    });
  }

  /**
   * POST /api/auth/resend-registration-code
   * Повторно відправити код реєстрації
   */
  public async resendRegistrationCode(): Promise<ApiResult<void>> {
    return await this.post<void>('/api/auth/resend-registration-code');
  }

  /**
   * Хелпер: швидкий логін з автоматичним збереженням userId
   */
  public async quickLogin(email: string, password: string): Promise<ApiResult<LoginResponse>> {
    const result = await this.login({ identifier: email, password });

    // Зберігаємо userId якщо логін успішний
    if (result.response.ok()) {
      const profile = await this.getProfile();
      if (profile.data && profile.data.id) {
        this.updateContext({ userId: profile.data.id });
      }
    }

    return result;
  }
}
