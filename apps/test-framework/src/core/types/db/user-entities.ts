export interface UserDbEntity {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status: string;
  failedLoginAttempts: number;
  lastLoginDate?: Date;
  lockedAt?: Date;
  fileId?: string;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPasswordDbEntity {
  id: string;
  userId: string;
  passwordHash: string;
  createdAt: Date;
  revokedAt?: Date;
}

export interface UserSessionDbEntity {
  id: string;
  userId: string;
  jti: string;
  tokenHash: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: any;
  expiresAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
