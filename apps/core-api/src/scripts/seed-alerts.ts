import 'dotenv/config';

import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

// Note: Ensure your TypeORM DataSource config is imported here
// For demonstration, we'll create a generic one, but in your actual codebase
// you should import your AppDataSource.
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASS || 'password',
  database: process.env.POSTGRES_DB_NAME || 'health_circle',
  entities: [path.join(__dirname, '../alerts/entities/*.entity{.ts,.js}')],
});

async function run() {
  await AppDataSource.initialize();
  console.log('DataSource initialized.');

  // 1. Parse CSV and seed alerts_regions
  const csvPath = path.resolve(__dirname, '../../assets/alerts_regions.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found at: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n');
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('Seeding alerts_regions...');
    for (let i = 4; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      const uidStr = parts[0];
      const name = parts[1];
      const type = parts[2];

      const uid = parseInt(uidStr, 10);
      if (isNaN(uid)) continue;

      // Upsert into alerts_regions
      await queryRunner.query(
        `
        INSERT INTO "alerts_regions" ("uid", "name", "type")
        VALUES ($1, $2, $3)
        ON CONFLICT ("uid") DO UPDATE SET "name" = $2, "type" = $3;
      `,
        [uid, name, type],
      );
    }
    await queryRunner.commitTransaction();
    console.log('Seeding complete.');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Failed to seed:', err);
    process.exit(1);
  }

  // 2. Fuzzy Matching (SQL) using pg_trgm
  console.log('Running fuzzy matching to map hdx_pcode...');
  try {
    // We update the alerts_regions table where type is 'Громада'.
    // We use <-> operator which returns the distance.
    // We filter by similarity() > 0.3 to avoid false positives.
    // We use a subquery to find the closest match.
    // Pass 1: Substring Match (handles 'м. Ковель та Ковельська територіальна громада' -> 'Ковельська')
    await AppDataSource.query(`
      UPDATE "alerts_regions" ar
      SET "hdx_pcode" = sub."pcode"
      FROM (
        SELECT 
          ar2.uid,
          (
            SELECT h.pcode
            FROM "hdx_hromadas" h
            WHERE ar2.name ILIKE '%' || h.adm3_ua || '%'
            LIMIT 1
          ) as pcode
        FROM "alerts_regions" ar2
        WHERE ar2.type = 'Громада'
      ) as sub
      WHERE ar.uid = sub.uid AND sub.pcode IS NOT NULL;
    `);

    // Pass 2: Trigram Similarity for slight mismatches (e.g. Володимир-Волинська -> Володимирська)
    await AppDataSource.query(`
      UPDATE "alerts_regions" ar
      SET "hdx_pcode" = sub."pcode"
      FROM (
        SELECT 
          ar2.uid,
          (
            SELECT h.pcode
            FROM "hdx_hromadas" h
            WHERE similarity(h.adm3_ua, ar2.name) > 0.2
            ORDER BY h.adm3_ua <-> ar2.name ASC
            LIMIT 1
          ) as pcode
        FROM "alerts_regions" ar2
        WHERE ar2.type = 'Громада' AND ar2.hdx_pcode IS NULL
      ) as sub
      WHERE ar.uid = sub.uid AND sub.pcode IS NOT NULL;
    `);
    console.log('Fuzzy matching complete.');
  } catch (err) {
    console.error('Failed to run fuzzy matching:', err);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

run().catch(console.error);
