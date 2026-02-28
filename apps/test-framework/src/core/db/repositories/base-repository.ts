import { DbCleaner } from '../db-cleaner';
import { Database } from '../schema';
import { CompiledQuery, Kysely } from 'kysely';

export abstract class BaseRepository<T, K extends keyof Database> {
  protected readonly db: Kysely<Database>;
  protected readonly dbCLeaner?: DbCleaner;
  protected readonly tableName: K
  constructor(options: {
    db: Kysely<Database>, 
    tableName: K, 
    dbCleaner?: DbCleaner
  }) {
    this.db = options.db;
    this.tableName = options.tableName;
    this.dbCLeaner = options.dbCleaner;
  }

  async getAll(): Promise<T[]> {
    return await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .execute() as unknown as T[];
  } 

  async getById(id: string | number): Promise<T | null> {
    const result = await (this.db
      .selectFrom(this.tableName)
      .selectAll() as any)
      .where('id', '=', id)
      .executeTakeFirst();
    
    return (result as unknown as T) || null;
  }

  async delete(id: string | number): Promise<void> {
    await (this.db
      .deleteFrom(this.tableName) as any)
      .where('id', '=', id)
      .execute();
  }

  protected async query(rawSql: string, params: any[] = []): Promise<T[]> {
    const result = await this.db.executeQuery(
      CompiledQuery.raw(rawSql, params)
    );
    
    return result.rows as T[];
  }

  async findBy(criteria: Partial<T>): Promise<T[]> {
    let query = this.db.selectFrom(this.tableName).selectAll();

    const keys = Object.keys(criteria) as (keyof T)[];
    if (keys.length === 0) return this.getAll();

    for (const key of keys) {
      const value = criteria[key];
      if (value !== undefined) {
        query = (query as any).where(key, '=', value);
      }
    }

    const result = await query.execute();
    return result as unknown as T[];
  }
}