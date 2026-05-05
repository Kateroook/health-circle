import 'dotenv/config';

import csv from 'csv-parser';
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

function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/(район|область|територіальна громада|громада|міська|селищна|сільська|м\.|с\.|смт\.)/gi, '')
    .trim();
}

async function run() {
  await AppDataSource.initialize();
  console.log('DataSource initialized.');

  const filePath = path.resolve(__dirname, '../../assets/', 'alerts_regions.csv');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found at: ${filePath}`);
    process.exit(1);
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  // 1. Отримуємо всі UID (і громад, і районів, і областей), які ще не мають hdx_pcode
  console.log('Fetching unmapped UIDs from database...');
  const unmappedRecords = await queryRunner.query(`SELECT uid FROM alerts_regions WHERE hdx_pcode IS NULL`);

  const unmappedUids = new Set(unmappedRecords.map((r: any) => r.uid));
  console.log(`Found ${unmappedUids.size} unmapped records to process.`);

  // 2. Читаємо CSV
  const dataRows: any[] = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ skipLines: 3 }))
      .on('data', (data) => dataRows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  await queryRunner.startTransaction();

  try {
    let currentOblast = '';
    let currentRaion = '';
    let newlyMappedCount = 0;
    let failedCount = 0;

    for (const row of dataRows) {
      const uid = parseInt(row['UID'], 10);
      const name = row['Назва']?.trim() || '';
      const type = row['Тип']?.trim() || '';
      let hdxPcode = null;

      if (!uid || !name || !type) continue;

      // Визначаємо, чи потрібно шукати pcode для цього запису
      const needsMapping = unmappedUids.has(uid);

      if (type === 'Область' || type === 'Місто з спеціальним статусом') {
        // Завжди оновлюємо стан, щоб дочірні райони/громади знали свою область
        currentOblast = name;
        currentRaion = '';

        if (needsMapping) {
          const normalizedAlertOblast = normalizeName(name);
          if (normalizedAlertOblast) {
            // Шукаємо префікс області (перші 4 символи)
            const result = await queryRunner.query(
              `
              SELECT SUBSTRING(pcode, 1, 4) as pcode, similarity(LOWER(adm1_ua), $1) as sim
              FROM hdx_hromadas
              WHERE similarity(LOWER(adm1_ua), $1) > 0.3 
              ORDER BY similarity(LOWER(adm1_ua), $1) DESC
              LIMIT 1;
              `,
              [normalizedAlertOblast],
            );

            if (result.length > 0) {
              hdxPcode = result[0].pcode;
              newlyMappedCount++;
            } else {
              failedCount++;
              console.log(`\n❌ ПРОБЛЕМНИЙ МАПІНГ (ОБЛАСТЬ): [UID: ${uid}] ${name}`);
            }
          }
        }
      } else if (type === 'Район') {
        // Завжди оновлюємо стан
        currentRaion = name;

        if (needsMapping) {
          const normalizedAlertRaion = normalizeName(name);
          const normalizedAlertOblast = normalizeName(currentOblast);

          if (normalizedAlertRaion) {
            // Шукаємо префікс району (перші 6 символів), спираючись на назву району та області
            const result = await queryRunner.query(
              `
              SELECT SUBSTRING(pcode, 1, 6) as pcode
              FROM hdx_hromadas
              WHERE similarity(LOWER(adm2_ua), $1) > 0.3 
                AND similarity(LOWER(adm1_ua), $2) > 0.3
              ORDER BY similarity(LOWER(adm2_ua), $1) DESC
              LIMIT 1;
              `,
              [normalizedAlertRaion, normalizedAlertOblast],
            );

            if (result.length > 0) {
              hdxPcode = result[0].pcode;
              newlyMappedCount++;
            } else {
              failedCount++;
              console.log(`\n❌ ПРОБЛЕМНИЙ МАПІНГ (РАЙОН): [UID: ${uid}] ${name} (Область: ${currentOblast})`);
            }
          }
        }
      } else if (type === 'Громада') {
        if (needsMapping) {
          const normalizedAlertHromada = normalizeName(name);
          const normalizedAlertRaion = normalizeName(currentRaion);

          if (normalizedAlertHromada) {
            let result = await queryRunner.query(
              `
              SELECT pcode, adm3_ua, adm2_ua, similarity(LOWER(adm3_ua), $1) as hromada_sim
              FROM hdx_hromadas
              WHERE similarity(LOWER(adm2_ua), $2) > 0.3 
              ORDER BY similarity(LOWER(adm3_ua), $1) DESC
              LIMIT 3;
              `,
              [normalizedAlertHromada, normalizedAlertRaion],
            );

            if (result.length === 0) {
              result = await queryRunner.query(
                `
                SELECT pcode, adm3_ua, adm2_ua, similarity(LOWER(adm3_ua), $1) as hromada_sim
                FROM hdx_hromadas
                ORDER BY similarity(LOWER(adm3_ua), $1) DESC
                LIMIT 3;
                `,
                [normalizedAlertHromada],
              );
            }

            if (result.length > 0) {
              const bestMatch = result[0];
              if (bestMatch.hromada_sim > 0.4) {
                hdxPcode = bestMatch.pcode;
                newlyMappedCount++;
              } else {
                failedCount++;
                console.log(`\n❌ ПРОБЛЕМНИЙ МАПІНГ (ГРОМАДА): [UID: ${uid}] ${name} (Район: ${currentRaion})`);
                console.log(`   Найкращі варіанти:`);
                result.forEach((r: any, idx: number) => {
                  console.log(
                    `   ${idx + 1}. ${r.adm3_ua} (Район HDX: ${r.adm2_ua}) - Збіг: ${(r.hromada_sim * 100).toFixed(1)}%`,
                  );
                });
              }
            }
          }
        }
      }

      // UPSERT працює для ВСІХ записів, щоб оновлювати назви,
      // але hdx_pcode дописується лише якщо ми його знайшли і його не було
      await queryRunner.query(
        `
        INSERT INTO "alerts_regions" ("uid", "name", "type", "hdx_pcode")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("uid") DO UPDATE 
        SET "name" = EXCLUDED."name",
            "type" = EXCLUDED."type",
            "hdx_pcode" = COALESCE(alerts_regions.hdx_pcode, EXCLUDED."hdx_pcode");
        `,
        [uid, name, type, hdxPcode],
      );
    }

    await queryRunner.commitTransaction();
    console.log(`\n✅ Готово!`);
    console.log(`🔗 Успішно знайдено та змаплено нових записів: ${newlyMappedCount}`);
    console.log(`⚠️ Залишилось без мапінгу (потребують перевірки): ${failedCount}`);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Помилка:', err);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

run().catch(console.error);
