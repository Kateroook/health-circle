import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserEntity1762595585393 implements MigrationInterface {
  name = 'AlterUserEntity1762595585393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "middle_name" character varying(100) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "middle_name"`);
  }
}
