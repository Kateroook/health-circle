import { UserStatus } from './common.types';

// ============ Auth DTOs ============

export interface UserLoginDto {
  identifier: string;
  password: string;
}

export interface LoginResponseDto {
  redirectUrl: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface UserSetupPasswordDto {
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserChangePasswordDto {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface UserProfileDto {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUpdatedAt?: Date;
}

// ============ Request Types ============

export interface LoginRequest extends UserLoginDto {}

export interface SetupPasswordRequest {
  email: string;
  code: string;
  body: UserSetupPasswordDto;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  body: UserSetupPasswordDto;
}

export interface ChangePasswordRequest extends UserChangePasswordDto {}

export interface ForgotPasswordRequest extends ForgotPasswordDto {}

// ============ Response Types ============

export interface LoginResponse extends LoginResponseDto {}

export interface ProfileResponse extends UserProfileDto {}

export type LogoutResponse = void;

export type RefreshTokenResponse = void;

export type PasswordSetupResponse = void;

export type PasswordResetResponse = void;

export type PasswordChangeResponse = void;

export type ForgotPasswordResponse = void;

export type ResendRegistrationCodeResponse = void;
