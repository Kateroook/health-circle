import { Client } from "pg";
import { UserEntity } from "../../types/api";
import { BaseRepository } from "./base-repository";
import { DbCleaner } from "../db-cleaner";

// repositories/UserRepository.ts
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(dbClient: Client, dbCleaner?: DbCleaner) {
    super({
        dbClient: dbClient, 
        tableName: 'users',
        dbCleaner: dbCleaner,
    });

    (this as any).mapper = {
      id: 'id',
      firstName: 'first_name',
      lastName: 'last_name',
      middleName: 'middle_name',
      fullName: 'full_name',
      email: 'email',
      phone: 'phone',
      status: 'status',
      failedLoginAttempts: 'failed_login_attempts',
      lastLoginDate: 'last_login_date',
      lockedAt: 'locked_at',
      fileId: 'file_id',
      fcmToken: 'fcm_token',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
  }
}