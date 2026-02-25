import { Client } from "pg";
import { BaseRepository } from "./base-repository";
import { ContactDbEntity } from "../../types/db/groups-and-contacts";

export class ContactRepository extends BaseRepository<ContactDbEntity> {
    constructor(dbClient: Client) {
        super(dbClient, 'contacts');
        (this as any).mapper = {
            id: 'id',
            ownerId: 'owner_id',
            targetId: 'target_id',
            alias: 'alias',
            createdAt: 'created_at',
            updatedAt: 'uploaded_at',
        }
    }
}