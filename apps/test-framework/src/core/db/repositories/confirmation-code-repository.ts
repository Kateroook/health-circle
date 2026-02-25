import { Client } from "pg";
import { ConfirmationCodeDbEntity } from "../../types/db/codes-and-files";
import { BaseRepository } from "./base-repository";

export class ConfirmationCodeRepository extends BaseRepository<ConfirmationCodeDbEntity> {
    constructor(dbClient: Client) {
        super(dbClient, 'confirmation_codes');
        (this as any).mapper = {
            id: 'id',
            userId: 'user_id',
            code: 'code',
            type: 'type',
            expiresAt: 'expires_at',
            createdAt: 'created_at',
        }
    }
}