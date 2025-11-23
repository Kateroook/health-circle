import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExternalFilesEntity1763916392841 implements MigrationInterface {
  name = 'CreateExternalFilesEntity1763916392841';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "external_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_name" text NOT NULL, "external_id" text NOT NULL, "md5" text NOT NULL, "size" integer NOT NULL, "mimetype" text NOT NULL, "unlink_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_07c9eb4c11f9e132ee8b37b0d60" UNIQUE ("external_id"), CONSTRAINT "PK_129e17eb3061aff8cb5a826e133" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "file_id" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_a367444399d0404c15d7dffdb02" UNIQUE ("file_id")`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a367444399d0404c15d7dffdb02" FOREIGN KEY ("file_id") REFERENCES "external_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a367444399d0404c15d7dffdb02"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_a367444399d0404c15d7dffdb02"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "file_id"`);
    await queryRunner.query(`DROP TABLE "external_files"`);
  }
}
