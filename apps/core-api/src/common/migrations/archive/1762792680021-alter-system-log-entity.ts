import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterSystemLogEntity1762792680021 implements MigrationInterface {
  name = 'AlterSystemLogEntity1762792680021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "_logs" ALTER COLUMN "level_code" TYPE smallint`);
    await queryRunner.query(`ALTER TABLE "_logs" ALTER COLUMN "msg" TYPE text`);
    await queryRunner.query(`ALTER TABLE "_logs" ALTER COLUMN "status_code" TYPE smallint`);
    await queryRunner.query(`ALTER TABLE "_logs" ALTER COLUMN "path" TYPE text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "_logs" ALTER COLUMN "path" TYPE character varying(1024)`);
    await queryRunner.query(`ALTER TABLE "_logs" ALTER COLUMN "status_code" TYPE integer`);
    await queryRunner.query(`ALTER TABLE "_logs" ALTER COLUMN "msg" TYPE character varying(1024)`);
    await queryRunner.query(`ALTER TABLE "_logs" ALTER COLUMN "level_code" TYPE integer`);
  }
}
