import { Client } from "pg";
import { ConfirmationCodeDbEntity } from "../../types/db/codes-and-files";
import { BaseRepository } from "./base-repository";
import { DbCleaner } from "../db-cleaner";

export class ConfirmationCodeRepository extends BaseRepository<ConfirmationCodeDbEntity> {
    constructor(dbClient: Client, dbCleaner?: DbCleaner) {
        super({
            dbClient: dbClient, 
            tableName: 'confirmation_codes',
            dbCleaner: dbCleaner,
        });
        
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