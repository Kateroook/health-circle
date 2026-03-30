import * as fs from 'fs';
import * as path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegions1774169922439 implements MigrationInterface {
  name = 'AddRegions1774169922439';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT IF EXISTS "FK_2c840df5db52dc6b4a1b0b69c6e"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_sessions_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_sessions_token_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_group_members_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_group_members_group_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_2c840df5db52dc6b4a1b0b69c6"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_20a555b299f75843aa53ff8b0e"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX__logs_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_activities_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_passwords_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_passwords_created_at"`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "alerts_regions" (
        "uid" integer PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "type" varchar(50) NOT NULL
      )`,
    );

    // Add alert_region_uid to users if it doesn't exist
    const hasColumn = await queryRunner.hasColumn('users', 'alert_region_uid');
    if (!hasColumn) {
      await queryRunner.query(`ALTER TABLE "users" ADD "alert_region_uid" integer`);
      await queryRunner.query(
        `ALTER TABLE "users" ADD CONSTRAINT "FK_alerts_region" FOREIGN KEY ("alert_region_uid") REFERENCES "alerts_regions"("uid") ON DELETE SET NULL`,
      );
    }

    // Seed alerts_regions
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

    if (csvPath) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.split('\n');
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
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_alerts_region"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "alert_region_uid"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alerts_regions"`);
  }
}
