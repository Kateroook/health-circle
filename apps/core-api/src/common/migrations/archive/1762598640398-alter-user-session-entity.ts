import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserSessionEntity1762598640398 implements MigrationInterface {
  name = 'AlterUserSessionEntity1762598640398';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE "user_sessions"
    ALTER COLUMN "ip_address" TYPE character varying(64)
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "ip_address"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "ip_address" character varying(16) NOT NULL`);
  }
}
