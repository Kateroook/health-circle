import * as fs from 'fs';
import * as path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedHromadasGeojson1776864317362 implements MigrationInterface {
  name = 'SeedHromadasGeojson1776864317362';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const possiblePaths = [
      path.resolve(process.cwd(), 'assets/ukr_admin3.geojson'),
      path.resolve(process.cwd(), 'apps/core-api/assets/ukr_admin3.geojson'),
      path.resolve(__dirname, '../../../assets/ukr_admin3.geojson'),
    ];

    let geojsonPath: string | undefined;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        geojsonPath = p;
        break;
      }
    }

    if (!geojsonPath) {
      console.warn('GeoJSON file not found. Skipping hromadas seeding.');
      return;
    }

    console.log(`Starting GeoJSON seeding from ${geojsonPath}...`);
    const content = fs.readFileSync(geojsonPath, 'utf8');
    const data = JSON.parse(content);
    const features = data.features || [];

    console.log(`Found ${features.length} features. Importing to hdx_hromadas...`);

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const props = feature.properties;
      const geom = feature.geometry;

      if (!props.adm3_pcode || !geom) continue;

      const pcode = props.adm3_pcode;
      const adm3_ua = props.adm3_name1 || props.adm3_name || '';
      const adm2_ua = props.adm2_name1 || props.adm2_name || '';
      const adm1_ua = props.adm1_name1 || props.adm1_name || '';

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

      if (i > 0 && i % 200 === 0) {
        console.log(`Seeded ${i} / ${features.length} hromadas...`);
      }
    }

    console.log(`Successfully seeded ${features.length} hromadas.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "hdx_hromadas";`);
  }
}
