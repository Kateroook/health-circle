import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely';
import { Database } from './schema';

dotenv.config();
export class DbManager {
  private static instance: Kysely<Database> | null = null;

  static async getInstance(): Promise<Kysely<Database>> {
    if (!this.instance) {
      const pool = new Pool({
        host: process.env.HEALTHCIRCLE_POSTGRES_HOST!,
        port: Number(process.env.HEALTHCIRCLE_POSTGRES_PORT!),
        user: process.env.HEALTHCIRCLE_POSTGRES_USER!,
        password: process.env.HEALTHCIRCLE_POSTGRES_PASS!,
        database: process.env.HEALTHCIRCLE_POSTGRES_DB_NAME!,
        ssl: Boolean(process.env.HEALTHCIRCLE_POSTGRES_SSL!),
        max: 10,
      });

      this.instance = new Kysely<Database>({
        dialect: new PostgresDialect({ pool }),
        plugins: [new CamelCasePlugin()],
      });
    }

    return this.instance;
  }
}
