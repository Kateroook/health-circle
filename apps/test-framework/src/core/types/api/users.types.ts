import { UserStatus } from './common.types';

// ============ Entity Types ============

export interface ExternalFilesApiEntity {
  id: string;
  fileName: string;
  externalId: string;
  md5: string;
  size: number;
  mimetype: string;
  unlinkAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserSessionApiEntity {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  jti: string;
  tokenHash: string;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  deviceInfo: Record<string, any>;
}

export interface UserApiEntity {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  lastLoginDate?: Date;
  status: UserStatus;
  fcmToken: string | null;
  lastStatusUpdate?: Date;
  failedLoginAttempts: number;
  region?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  lastPersonalRollCallAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lockedAt?: Date;
  avatarUpdatedAt?: Date;
  file?: ExternalFilesApiEntity;
  sessions?: UserSessionApiEntity[];
  isAlias?: boolean;
}

// ============ DTOs ============

export interface CreateUserDto {
  phone: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
}

export interface ModifyUserDto {
  id: string;
  phone?: string;
  email?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  alertRegionUid?: number;
  latitude?: number;
  longitude?: number;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}

// ============ Request Types ============

export interface GetUserRequest {
  id: string;
}

export interface GetUserAvatarRequest {
  id: string;
}

export interface UploadUserAvatarRequest {
  id: string;
  file: Buffer | Blob;
}

export interface DeleteUserAvatarRequest {
  id: string;
}

export interface CreateUserRequest extends CreateUserDto {}

export interface ModifyUserRequest extends ModifyUserDto {}

export interface UpdateUserStatusRequest extends UpdateUserStatusDto {}

export interface SaveFcmTokenRequest {
  token: string;
}

export interface ResetUserPasswordRequest {
  id: string;
}

// ============ Response Types ============

export interface GetUserResponse extends UserApiEntity {}

export type GetUserAvatarResponse = Buffer;

export interface UploadUserAvatarResponse {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUpdatedAt?: Date;
}

export type DeleteUserAvatarResponse = void;

export interface CreateUserResponse extends UserApiEntity {}

export interface ModifyUserResponse extends UserApiEntity {}

export type DeleteUserResponse = void;

export interface UpdateUserStatusResponse extends UserApiEntity {}

export interface SaveFcmTokenResponse extends UserApiEntity {}

export type ResetUserPasswordResponse = void;
