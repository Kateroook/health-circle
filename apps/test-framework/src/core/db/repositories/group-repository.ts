import { Kysely } from 'kysely';
import { GroupDbEntity } from '../../types/db/groups-and-contacts';
import { DbCleaner } from '../db-cleaner';
import { Database } from '../schema';
import { BaseRepository } from './base-repository';

export class GroupRepository extends BaseRepository<GroupDbEntity, 'group'> {
  constructor(db: Kysely<Database>, dbCleaner?: DbCleaner) {
    super({
      db: db,
      tableName: 'group',
      dbCleaner: dbCleaner,
    });
  }
}
