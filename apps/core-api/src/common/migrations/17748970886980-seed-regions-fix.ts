import * as fs from 'fs';
import * as path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRegionsFix17748970886980 implements MigrationInterface {
  name = 'SeedRegionsFix17748970886980';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('alerts_regions');
    if (!tableExists) {
      console.log('Table alerts_regions does not exist, skipping seeding.');
      return;
    }

    const countRes = await queryRunner.query('SELECT count(*) FROM "alerts_regions"');
    const count = parseInt(countRes[0].count);
    if (count > 0) {
      console.log(`Table alerts_regions already has ${count} records, skipping seeding.`);
      return;
    }

    // Search for CSV in multiple locations
    const searchPaths = [
      path.resolve(__dirname, '../../../assets/alerts_regions.csv'), // src/common/migrations/ -> apps/core-api/assets/
      path.resolve(__dirname, '../../../../assets/alerts_regions.csv'), // dist/src/common/migrations/ -> apps/core-api/assets/
      path.resolve(process.cwd(), 'apps/core-api/assets/alerts_regions.csv'), // root -> apps/core-api/assets/
      path.resolve(process.cwd(), 'assets/alerts_regions.csv'), // apps/core-api/ -> assets/
    ];

    let csvPath = '';
    for (const p of searchPaths) {
      if (fs.existsSync(p)) {
        csvPath = p;
        break;
      }
    }

    if (!csvPath) {
      console.error('CSV NOT FOUND in any of the search paths:', searchPaths);
      return;
    }

    console.log('Seeding alerts_regions from:', csvPath);
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');
    let inserted = 0;

    for (let i = 4; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      const uid = parseInt(parts[0]);
      const name = parts[1];
      const type = parts[2];

      if (isNaN(uid)) continue;

      await queryRunner.query(
        `INSERT INTO "alerts_regions" ("uid", "name", "type") 
         VALUES ($1, $2, $3) 
         ON CONFLICT ("uid") DO UPDATE SET "name" = $2, "type" = $3`,
        [uid, name, type],
      );
      inserted++;
    }

    console.log(`Successfully seeded ${inserted} regions into alerts_regions.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No need to do anything in down
  }
}
