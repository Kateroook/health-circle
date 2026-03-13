import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserEntity1772969940227 implements MigrationInterface {
  name = 'AlterUserEntity1772969940227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group" ADD "last_roll_call_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD "region" character varying`);
    await queryRunner.query(`ALTER TYPE "public"."users_status_enum" RENAME TO "users_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('SAFE', 'WAS_SAFE', 'DANGER', 'UNKNOWN')`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum" USING "status"::"text"::"public"."users_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'UNKNOWN'`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_status_enum_old" AS ENUM('SAFE', 'DANGER', 'UNKNOWN')`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum_old" USING "status"::"text"::"public"."users_status_enum_old"`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'UNKNOWN'`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."users_status_enum_old" RENAME TO "users_status_enum"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "region"`);
    await queryRunner.query(`ALTER TABLE "group" DROP COLUMN "last_roll_call_at"`);
  }
}
