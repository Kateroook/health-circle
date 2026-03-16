import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserEntity1772743614997 implements MigrationInterface {
  name = 'AlterUserEntity1772743614997';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "is_registered" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `UPDATE "users" SET "is_registered" = true WHERE "id" IN (SELECT DISTINCT "user_id" FROM "user_sessions")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_registered"`);
  }
}
