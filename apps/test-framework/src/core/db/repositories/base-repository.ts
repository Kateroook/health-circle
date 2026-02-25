import { Client } from 'pg';

export abstract class BaseRepository<T> {
  protected readonly mapper: Record<string, string> = {}; //key = property, value = column
  protected readonly dbClient: Client;
  protected readonly tableName: string
  constructor(dbClient: Client, tableName: string) {
    this.dbClient = dbClient;
    this.tableName = tableName;
  }

  mapPropertyToColumn(property: string) {
    return this.mapper[property] || property;
  }

  protected mapRowToEntity(row: any): T {
    if (!row) return row;

    const entity = {} as T;
    
    // Якщо маппер пустий, повертаємо як є (або можна додати логіку авто-мапінгу)
    if (Object.keys(this.mapper).length === 0) return row as T;

    for (const [property, column] of Object.entries(this.mapper)) {
      if (row[column] !== undefined) {
        // Кастуємо до any, щоб TS не сварився на динамічне заповнення
        (entity as any)[property] = row[column];
      }
    }

    return entity;
  }



  async getAll(): Promise<T[]> {
    const query = `SELECT * FROM "${this.tableName}"`;
    const result = await this.dbClient.query(query);
    return result.rows.map(row => this.mapRowToEntity(row));
  } 

  // Отримати за ID
  async getById(id: string | number): Promise<T | null> {
    const query = `SELECT * FROM "${this.tableName}" WHERE id = $1`;
    const result = await this.dbClient.query(query, [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  // Видалити
  async delete(id: string | number): Promise<void> {
    const query = `DELETE FROM "${this.tableName}" WHERE id = $1`;
    await this.dbClient.query(query, [id]);
  }

  // Спеціальний метод для виконання довільних запитів
  protected async query(sql: string, params?: any[]): Promise<T[]> {
    const result = await this.dbClient.query(sql, params);
    return result.rows;
  }

  // BaseRepository.ts
  async findBy(criteria: Partial<T>): Promise<T[]> {
    const keys = Object.keys(criteria);
    if (keys.length === 0) return this.getAll();

    // Будуємо частину WHERE: "column1" = $1 AND "column2" = $2
    const whereClause = keys
        .map((key, index) => `"${this.mapPropertyToColumn(key)}" = $${index + 1}`)
        .join(' AND ');

    const values = Object.values(criteria);
    const query = `SELECT * FROM "${this.tableName}" WHERE ${whereClause}`;
    
    const result = await this.dbClient.query(query, values);
    return result.rows.map(row => this.mapRowToEntity(row));
  }
}