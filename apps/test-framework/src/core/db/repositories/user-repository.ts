import { BaseRepository } from "./base-repository";
import { DbCleaner } from "../db-cleaner";
import { Kysely } from "kysely";
import { Database } from "../schema";
import { UserDbEntity } from "../../types/db/user-entities";

// repositories/UserRepository.ts
export class UserRepository extends BaseRepository<UserDbEntity, 'users'> {
  constructor(db: Kysely<Database>, dbCleaner?: DbCleaner) {
      super({
          db: db, 
          tableName: 'users',
          dbCleaner: dbCleaner,
      });
  }
}