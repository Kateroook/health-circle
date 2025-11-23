import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterGroupEntity1763903271836 implements MigrationInterface {
  name = 'AlterGroupEntity1763903271836';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee"`);
    await queryRunner.query(`ALTER TABLE "group" ADD "invite_code" character varying(32)`);
    await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "UQ_aaeb14e9a2dade7d0fb0ee38b67" UNIQUE ("invite_code")`);
    await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "UQ_8a45300fd825918f3b40195fbdc"`);
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee"`);
    await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "UQ_8a45300fd825918f3b40195fbdc" UNIQUE ("name")`);
    await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "UQ_aaeb14e9a2dade7d0fb0ee38b67"`);
    await queryRunner.query(`ALTER TABLE "group" DROP COLUMN "invite_code"`);
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
