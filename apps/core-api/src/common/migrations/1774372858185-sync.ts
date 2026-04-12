import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sync1774372858185 implements MigrationInterface {
  name = 'Sync1774372858185';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_sessions_token_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_sessions_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_875541f7dbe1b8565414f9f80b"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e2dd77cb8a46c78d8ea34de039"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_users_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_group_members_group_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_group_members_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX__logs_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_activities_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_passwords_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_passwords_user_id"`);
    await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT IF EXISTS "FK_26d387f3e8de5b59428adbbc828"`);
    await queryRunner.query(`ALTER TABLE "group" ALTER COLUMN "owner_id" SET NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_65cbf5fcb331619593ee334c7c" ON "users" ("email") WHERE email IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f169d18dc7fce81f4c20974fd0" ON "users" ("phone") WHERE phone IS NOT NULL`);
    await queryRunner.query(`DELETE FROM "user_notification_settings" WHERE "user_id" NOT IN (SELECT "id" FROM "users")`);
    await queryRunner.query(
      `ALTER TABLE "user_notification_settings" ADD CONSTRAINT "FK_52182ffd0f785e8256f8fcb4fd6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group" ADD CONSTRAINT "FK_26d387f3e8de5b59428adbbc828" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT IF EXISTS "FK_26d387f3e8de5b59428adbbc828"`);
    await queryRunner.query(
      `ALTER TABLE "user_notification_settings" DROP CONSTRAINT IF EXISTS "FK_52182ffd0f785e8256f8fcb4fd6"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f169d18dc7fce81f4c20974fd0"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_65cbf5fcb331619593ee334c7c"`);
    await queryRunner.query(`ALTER TABLE "group" ALTER COLUMN "owner_id" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "group" ADD CONSTRAINT "FK_26d387f3e8de5b59428adbbc828" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_user_passwords_user_id" ON "user_passwords" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_user_passwords_created_at" ON "user_passwords" ("created_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_user_activities_user_id" ON "user_activities" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX__logs_time" ON "_logs" ("time") `);
    await queryRunner.query(`CREATE INDEX "IDX_group_members_user_id" ON "group_members" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_group_members_group_id" ON "group_members" ("group_id") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_phone" ON "users" ("phone") WHERE (phone IS NOT NULL)`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email") WHERE (email IS NOT NULL)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e2dd77cb8a46c78d8ea34de039" ON "users" ("email") WHERE (email IS NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_875541f7dbe1b8565414f9f80b" ON "users" ("phone") WHERE (phone IS NOT NULL)`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_user_sessions_user_id" ON "user_sessions" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_user_sessions_token_hash" ON "user_sessions" ("token_hash") `);
  }
}
