import * as fs from 'fs';
import * as path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAlertsRegionsMapping1776864317361 implements MigrationInterface {
  name = 'SeedAlertsRegionsMapping1776864317361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const csvPath = path.resolve(__dirname, '../../../assets/alerts_regions_mapping.csv');

    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV mapping file not found at ${csvPath}. Skipping seeding.`);
      return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const [uid, name, type, pcode] = trimmed.split(',');

      if (!uid || !name || !type) continue;

      await queryRunner.query(
        `
        INSERT INTO "alerts_regions" ("uid", "name", "type", "hdx_pcode")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("uid") DO UPDATE 
        SET "name" = EXCLUDED."name",
            "type" = EXCLUDED."type",
            "hdx_pcode" = EXCLUDED."hdx_pcode";
      `,
        [parseInt(uid, 10), name, type, pcode || null],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "alerts_regions" SET "hdx_pcode" = NULL;`);
  }
}
