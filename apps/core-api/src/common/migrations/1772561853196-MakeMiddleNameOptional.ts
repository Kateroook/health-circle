import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeMiddleNameOptional1772561853196 implements MigrationInterface {
  name = 'MakeMiddleNameOptional1772561853196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "middle_name" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "middle_name" SET NOT NULL`);
  }
}
