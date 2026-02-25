import { Client } from "pg";
import { GroupEntity } from "../../types/api";
import { BaseRepository } from "./base-repository";
import { DbCleaner } from "../db-cleaner";

export class GroupRepository extends BaseRepository<GroupEntity> {
  constructor(dbClient: Client, dbCleaner?: DbCleaner) {
    super({
        dbClient: dbClient, 
        tableName: 'group',
        dbCleaner: dbCleaner,
    }); // Обережно, назва таблиці в однині

    (this as any).mapper = {
      id: 'id',
      name: 'name',
      ownerId: 'owner_id',
      inviteCode: 'invite_code',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
  }
}