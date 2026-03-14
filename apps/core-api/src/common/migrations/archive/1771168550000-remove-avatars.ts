import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAvatars1771168550000 implements MigrationInterface {
  name = 'RemoveAvatars1771168550000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TEMP TABLE "temp_avatar_ids" AS 
            SELECT "file_id" FROM "users" WHERE "file_id" IS NOT NULL
        `);

    await queryRunner.query(`
            UPDATE "users" 
            SET "file_id" = NULL, "avatar_updated_at" = NULL 
            WHERE "file_id" IS NOT NULL
        `);

    await queryRunner.query(`
            DELETE FROM "external_files" 
            WHERE "id" IN (
                SELECT "file_id" FROM "temp_avatar_ids"
            )
        `);
    await queryRunner.query(`DROP TABLE "temp_avatar_ids"`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve();
  }
}
