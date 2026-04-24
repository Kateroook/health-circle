import { MigrationInterface, QueryRunner } from 'typeorm';

export class LowercaseExistingEmails1772743615000 implements MigrationInterface {
  name = 'LowercaseExistingEmails1772743615000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "users" SET "email" = LOWER("email") WHERE "email" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
