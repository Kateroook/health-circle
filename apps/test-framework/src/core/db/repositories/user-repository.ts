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

  async waitForUserByEmail(email: string, timeout = 5000): Promise<UserDbEntity> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const user = await (
        this.db.selectFrom(this.tableName).selectAll().where('email', '=', email.toLowerCase()) as any
      ).executeTakeFirst();

      if (user) {
        return user as unknown as UserDbEntity;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Користувача з поштою ${email} не знайдено в БД протягом ${timeout}мс`);
  }
}
