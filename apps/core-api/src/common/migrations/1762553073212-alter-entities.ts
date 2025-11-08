import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterEntities1762553073212 implements MigrationInterface {
    name = 'AlterEntities1762553073212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" character varying NOT NULL`);
    }

}
