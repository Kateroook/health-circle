import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatus1764020197638 implements MigrationInterface {
  name = 'AddUserStatus1764020197638';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('SAFE', 'DANGER', 'UNKNOWN')`);
    await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'UNKNOWN'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "fcm_token" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "last_status_update" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_status_update"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fcm_token"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
  }
}
