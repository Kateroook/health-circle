import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContactsAndFullName1771181633191 implements MigrationInterface {
    name = 'AddContactsAndFullName1771181633191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "target_id" uuid NOT NULL, "alias" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0ea6df717232d78c1f98757f19" ON "contacts" ("owner_id", "target_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "full_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_ac270d32a01ee22d2e98a8f8532" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_e769615ca479c63a2ff8a2a54d8" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_e769615ca479c63a2ff8a2a54d8"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_ac270d32a01ee22d2e98a8f8532"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ea6df717232d78c1f98757f19"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
    }

}
