import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserUniqueness1771007170534 implements MigrationInterface {
  name = 'AlterUserUniqueness1771007170534';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`);
    await queryRunner.query(`ALTER TYPE "public"."confirmation_codes_type_enum" RENAME TO "confirmation_codes_type_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."confirmation_codes_type_enum" AS ENUM('REGISTRATION', 'PASSWORD_RESET')`);
    await queryRunner.query(
      `ALTER TABLE "confirmation_codes" ALTER COLUMN "type" TYPE "public"."confirmation_codes_type_enum" USING "type"::"text"::"public"."confirmation_codes_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."confirmation_codes_type_enum_old"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e2dd77cb8a46c78d8ea34de039" ON "users" ("email") WHERE "email" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_875541f7dbe1b8565414f9f80b" ON "users" ("phone") WHERE "phone" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_875541f7dbe1b8565414f9f80b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e2dd77cb8a46c78d8ea34de039"`);
    await queryRunner.query(
      `CREATE TYPE "public"."confirmation_codes_type_enum_old" AS ENUM('REGISTRATION', 'PASSWORD_RESET', 'PASSWORD_EXPIRATION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "confirmation_codes" ALTER COLUMN "type" TYPE "public"."confirmation_codes_type_enum_old" USING "type"::"text"::"public"."confirmation_codes_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."confirmation_codes_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."confirmation_codes_type_enum_old" RENAME TO "confirmation_codes_type_enum"`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone")`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
  }
}
