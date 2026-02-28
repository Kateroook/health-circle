import { BaseRepository } from "./base-repository";
import { DbCleaner } from "../db-cleaner";
import { Kysely } from "kysely";
import { Database } from "../schema";
import { GroupDbEntity } from "../../types/db/groups-and-contacts";

export class GroupRepository extends BaseRepository<GroupDbEntity, 'group'> {
  constructor(db: Kysely<Database>, dbCleaner?: DbCleaner) {
        super({
            db: db, 
            tableName: 'group',
            dbCleaner: dbCleaner,
        });
    }
}