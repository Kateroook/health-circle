export interface ExternalFileDbEntity {
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

export interface ConfirmationCodeDbEntity {
  id: string;
  userId?: string;
  code: string;
  type: string;
  expiresAt: Date;
  createdAt: Date;
}