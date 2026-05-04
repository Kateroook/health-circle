import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetupPostgisGeocoding1776864317359 implements MigrationInterface {
  name = 'SetupPostgisGeocoding1776864317359';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enable necessary extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // 2. Create hdx_hromadas table (if not exists, managed by TypeORM normally but explicitly created here for clarity)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hdx_hromadas" (
        "pcode" character varying(50) NOT NULL,
        "adm3_ua" character varying(255) NOT NULL,
        "adm2_ua" character varying(255),
        "adm1_ua" character varying(255),
        "geom" geometry(MultiPolygon,4326) NOT NULL,
        CONSTRAINT "PK_hdx_hromadas" PRIMARY KEY ("pcode")
      );
    `);

    // 3. Create spatial index
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_hdx_hromadas_geom" ON "hdx_hromadas" USING GiST ("geom");
    `);

    // 4. Update alerts_regions (alerts_metadata) to include hdx_pcode
    // Note: The table is already called alerts_regions in the codebase.
    await queryRunner.query(`
      ALTER TABLE "alerts_regions" ADD COLUMN IF NOT EXISTS "hdx_pcode" character varying(50);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alerts_regions" DROP COLUMN IF EXISTS "hdx_pcode";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_hdx_hromadas_geom";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hdx_hromadas";`);
    // Not dropping extensions as they might be used by other DBs/schemas
  }
}
