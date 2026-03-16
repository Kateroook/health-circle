import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupBlockList1771186507666 implements MigrationInterface {
  name = 'AddGroupBlockList1771186507666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "group_block_list" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "group_id" uuid, "user_id" uuid, "created_by" uuid, CONSTRAINT "UQ_f2a972c4e6c899897cdcc0a9876" UNIQUE ("group_id", "user_id"), CONSTRAINT "PK_83064a7ae531a6999e3991243f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_block_list" ADD CONSTRAINT "FK_c0caf7cfe48585ab1bbb91ef292" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_block_list" ADD CONSTRAINT "FK_6f6d3f6d3f519118f1a2a4c5c24" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_block_list" ADD CONSTRAINT "FK_f09888999c6bdb1547e9894e39c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group_block_list" DROP CONSTRAINT "FK_f09888999c6bdb1547e9894e39c"`);
    await queryRunner.query(`ALTER TABLE "group_block_list" DROP CONSTRAINT "FK_6f6d3f6d3f519118f1a2a4c5c24"`);
    await queryRunner.query(`ALTER TABLE "group_block_list" DROP CONSTRAINT "FK_c0caf7cfe48585ab1bbb91ef292"`);
    await queryRunner.query(`DROP TABLE "group_block_list"`);
  }
}
