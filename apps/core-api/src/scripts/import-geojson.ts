import 'dotenv/config';

import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASS || 'password',
  database: process.env.POSTGRES_DB_NAME || 'health_circle',
});

async function run() {
  await AppDataSource.initialize();
  console.log('DataSource initialized.');

  const geojsonPath = path.resolve(__dirname, '../../assets/ukr_admin3.geojson');
  if (!fs.existsSync(geojsonPath)) {
    console.error(`GeoJSON not found at: ${geojsonPath}`);
    process.exit(1);
  }

  console.log('Reading GeoJSON file (this might take a few seconds)...');
  const fileContent = fs.readFileSync(geojsonPath, 'utf8');
  const data = JSON.parse(fileContent);

  const features = data.features || [];
  console.log(`Found ${features.length} features. Importing...`);

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const props = feature.properties;
      const geom = feature.geometry;

      if (!props.adm3_pcode || !geom) continue;

      const pcode = props.adm3_pcode;
      const adm3_ua = props.adm3_name1 || props.adm3_name || '';
      const adm2_ua = props.adm2_name1 || props.adm2_name || '';
      const adm1_ua = props.adm1_name1 || props.adm1_name || '';

      // We use ST_Multi to ensure any Polygon is cast to MultiPolygon as required by our schema
      await queryRunner.query(
        `
        INSERT INTO "hdx_hromadas" ("pcode", "adm3_ua", "adm2_ua", "adm1_ua", "geom")
        VALUES ($1, $2, $3, $4, ST_Multi(ST_GeomFromGeoJSON($5)))
        ON CONFLICT ("pcode") DO UPDATE 
        SET "adm3_ua" = EXCLUDED."adm3_ua",
            "adm2_ua" = EXCLUDED."adm2_ua",
            "adm1_ua" = EXCLUDED."adm1_ua",
            "geom" = EXCLUDED."geom";
      `,
        [pcode, adm3_ua, adm2_ua, adm1_ua, JSON.stringify(geom)],
      );

      if (i > 0 && i % 100 === 0) {
        console.log(`Imported ${i} / ${features.length}...`);
      }
    }

    await queryRunner.commitTransaction();
    console.log('Successfully imported all GeoJSON features!');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Failed to import GeoJSON:', err);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

run().catch(console.error);
