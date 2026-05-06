import * as fs from 'fs';
import * as path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAlertsRegionsMapping1776864317361 implements MigrationInterface {
  name = 'SeedAlertsRegionsMapping1776864317361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const possiblePaths = [
      path.resolve(process.cwd(), 'assets/alerts_regions_mapping.csv'), // Docker / Standalone
      path.resolve(process.cwd(), 'apps/core-api/assets/alerts_regions_mapping.csv'), // Monorepo root
      path.resolve(__dirname, '../../../assets/alerts_regions_mapping.csv'), // Relative to source
    ];

    let csvPath: string | undefined;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        csvPath = p;
        break;
      }
    }

    if (!csvPath) {
      throw new Error(`CRITICAL: CSV mapping file NOT found. Searched in: ${possiblePaths.join(', ')}. Migration aborted.`);
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');
    let count = 0;

    console.log(`Starting seeding from ${csvPath}...`);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const [uid, name, type, pcode] = trimmed.split(',');

      if (!uid || !name || !type) {
        console.warn(`Skipping invalid line: ${line}`);
        continue;
      }

      await queryRunner.query(
        `
        INSERT INTO "alerts_regions" ("uid", "name", "type", "hdx_pcode")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("uid") DO UPDATE 
        SET "name" = EXCLUDED."name",
            "type" = EXCLUDED."type",
            "hdx_pcode" = EXCLUDED."hdx_pcode";
      `,
        [parseInt(uid, 10), name, type, pcode ? pcode.trim() : null],
      );
      count++;
    }

    console.log(`Successfully seeded/updated ${count} alert regions.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "alerts_regions" SET "hdx_pcode" = NULL;`);
  }
}
