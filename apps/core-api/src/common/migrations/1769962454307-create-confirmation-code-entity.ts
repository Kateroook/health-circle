import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConfirmationCodeEntity1769962454307 implements MigrationInterface {
    name = 'CreateConfirmationCodeEntity1769962454307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."confirmation_codes_type_enum" AS ENUM('REGISTRATION', 'PASSWORD_RESET', 'PASSWORD_EXPIRATION')`);
        await queryRunner.query(`CREATE TABLE "confirmation_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(255) NOT NULL, "type" "public"."confirmation_codes_type_enum" NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_a69728afe2297548351199d8984" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "confirmation_codes" ADD CONSTRAINT "FK_fb179afebc1bcd8110f06ef51d3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "confirmation_codes" DROP CONSTRAINT "FK_fb179afebc1bcd8110f06ef51d3"`);
        await queryRunner.query(`DROP TABLE "confirmation_codes"`);
        await queryRunner.query(`DROP TYPE "public"."confirmation_codes_type_enum"`);
    }

}
