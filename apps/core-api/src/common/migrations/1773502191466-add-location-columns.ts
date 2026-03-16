import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationColumns1773502191466 implements MigrationInterface {
  name = 'AddLocationColumns1773502191466';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "district" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "latitude" double precision`);
    await queryRunner.query(`ALTER TABLE "users" ADD "longitude" double precision`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "latitude"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "district"`);
  }
}
