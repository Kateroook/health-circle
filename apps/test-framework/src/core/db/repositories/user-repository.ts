import { Kysely } from 'kysely';
import { UserDbEntity } from '../../types/db/user-entities';
import { DbCleaner } from '../db-cleaner';
import { Database } from '../schema';
import { BaseRepository } from './base-repository';

// repositories/UserRepository.ts
export class UserRepository extends BaseRepository<UserDbEntity, 'users'> {
  constructor(db: Kysely<Database>, dbCleaner?: DbCleaner) {
    super({
      db: db,
      tableName: 'users',
      dbCleaner: dbCleaner,
    });
  }

  async getLast(column: any = 'id'): Promise<UserDbEntity | null> {
    const result = await (this.db.selectFrom(this.tableName).selectAll() as any)
      .orderBy(column, 'desc')
      .executeTakeFirst();

    return (result as unknown as UserDbEntity) || null;
  }
}
