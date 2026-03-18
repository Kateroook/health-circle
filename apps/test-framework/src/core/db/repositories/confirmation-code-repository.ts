import { ConfirmationCodeDbEntity } from '../../types/db/codes-and-files';
import { BaseRepository } from './base-repository';
import { DbCleaner } from '../db-cleaner';
import { Kysely } from 'kysely';
import { Database } from '../schema';

export class ConfirmationCodeRepository extends BaseRepository<ConfirmationCodeDbEntity, 'confirmation_codes'> {
  constructor(db: Kysely<Database>, dbCleaner?: DbCleaner) {
    super({
      db: db,
      tableName: 'confirmation_codes',
      dbCleaner: dbCleaner,
    });
  }

  async getAllUserCodes(userId: string) : Promise<ConfirmationCodeDbEntity[]> {
    return await this.findBy({userId: userId});
  }

  async getLastUserCode(userId: string) : Promise<ConfirmationCodeDbEntity> {
    return (await this.getAllUserCodes(userId))[0];
  }

  async getUserCodeCount(userId: string) : Promise<number> {
    return (await this.getAllUserCodes(userId)).length;
  }
}
