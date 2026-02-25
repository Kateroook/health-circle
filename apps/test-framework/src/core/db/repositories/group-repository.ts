import { Client } from "pg";
import { GroupEntity } from "../../types/api";
import { BaseRepository } from "./base-repository";

// repositories/GroupRepository.ts
export class GroupRepository extends BaseRepository<GroupEntity> {
  constructor(dbClient: Client) {
    super(dbClient, 'group'); // Обережно, назва таблиці в однині
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