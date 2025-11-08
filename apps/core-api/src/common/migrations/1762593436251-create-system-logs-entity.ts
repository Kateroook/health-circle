import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemLogsEntity1762593436251 implements MigrationInterface {
  name = 'CreateSystemLogsEntity1762593436251';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "_logs" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "level_code" integer NOT NULL, "hostname" character varying(255) NOT NULL, "msg" character varying(1024) NOT NULL, "pid" integer NOT NULL, "time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, "status_code" integer, "path" character varying(1024), "func" character varying(255), "stack" jsonb, "data" jsonb, "type_code" character varying(255) DEFAULT 'other', CONSTRAINT "PK_e0028d82ef01d7a97300ad8ec1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_5c0d52a61dfa0d1d8ec3918b7d" ON "_logs" ("time") `);
    await queryRunner.query(`CREATE INDEX "IDX_706b6f46127475f3bd5ef1a734" ON "_logs" ("user_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_706b6f46127475f3bd5ef1a734"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5c0d52a61dfa0d1d8ec3918b7d"`);
    await queryRunner.query(`DROP TABLE "_logs"`);
  }
}
