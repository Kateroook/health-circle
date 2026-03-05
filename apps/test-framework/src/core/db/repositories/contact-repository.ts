import { BaseRepository } from './base-repository';
import { ContactDbEntity } from '../../types/db/groups-and-contacts';
import { DbCleaner } from '../db-cleaner';
import { Kysely } from 'kysely';
import { Database } from '../schema';

export class ContactRepository extends BaseRepository<ContactDbEntity, 'contacts'> {
  constructor(db: Kysely<Database>, dbCleaner?: DbCleaner) {
    super({
      db: db,
      tableName: 'contacts',
      dbCleaner: dbCleaner,
    });
  }
}
