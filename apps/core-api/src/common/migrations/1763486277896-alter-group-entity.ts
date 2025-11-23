import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterGroupEntity1763486277896 implements MigrationInterface {
  name = 'AlterGroupEntity1763486277896';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "group_members" ("group_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_f5939ee0ad233ad35e03f5c65c1" PRIMARY KEY ("group_id", "user_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_2c840df5db52dc6b4a1b0b69c6" ON "group_members" ("group_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_20a555b299f75843aa53ff8b0e" ON "group_members" ("user_id") `);
    await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "UQ_358a279b652eb509c52f09121d4"`);
    await queryRunner.query(`ALTER TABLE "group" DROP COLUMN "join_code"`);
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee"`);
    await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e"`);
    await queryRunner.query(`ALTER TABLE "group" ADD "join_code" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "UQ_358a279b652eb509c52f09121d4" UNIQUE ("join_code")`);
    await queryRunner.query(`DROP INDEX "public"."IDX_20a555b299f75843aa53ff8b0e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2c840df5db52dc6b4a1b0b69c6"`);
    await queryRunner.query(`DROP TABLE "group_members"`);
  }
}
