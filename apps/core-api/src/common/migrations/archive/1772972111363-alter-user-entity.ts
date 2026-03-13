import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserEntity1772972111363 implements MigrationInterface {
  name = 'AlterUserEntity1772972111363';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "last_personal_roll_call_at" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_personal_roll_call_at"`);
  }
}
