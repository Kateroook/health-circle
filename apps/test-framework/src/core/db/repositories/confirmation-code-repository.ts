import { ConfirmationCodeDbEntity } from "../../types/db/codes-and-files";
import { BaseRepository } from "./base-repository";
import { DbCleaner } from "../db-cleaner";
import { Kysely } from "kysely";
import { Database } from "../schema";

export class ConfirmationCodeRepository extends BaseRepository<ConfirmationCodeDbEntity, 'confirmation_codes'> {
    constructor(db: Kysely<Database>, dbCleaner?: DbCleaner) {
        super({
            db: db, 
            tableName: 'confirmation_codes',
            dbCleaner: dbCleaner,
        });
    }
}