import { MigrationInterface, QueryRunner } from "typeorm";

export class CascadeDeleteAndRelaxLogConstraints1772048762122 implements MigrationInterface {
    name = 'CascadeDeleteAndRelaxLogConstraints1772048762122'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_ac270d32a01ee22d2e98a8f8532"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_e769615ca479c63a2ff8a2a54d8"`);
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_26d387f3e8de5b59428adbbc828"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
        await queryRunner.query(`ALTER TABLE "user_passwords" DROP CONSTRAINT "FK_69bf155ad044d776976470eb032"`);
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_a283f37e08edf5e37d38b375eec"`);
        await queryRunner.query(`ALTER TABLE "data_logs_changes" DROP CONSTRAINT "FK_54f1c5e7cd44f74f86e9095a74a"`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "device_info" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "ip_address" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "user_agent" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_ac270d32a01ee22d2e98a8f8532" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_e769615ca479c63a2ff8a2a54d8" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_26d387f3e8de5b59428adbbc828" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_passwords" ADD CONSTRAINT "FK_69bf155ad044d776976470eb032" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_activities" ADD CONSTRAINT "FK_a283f37e08edf5e37d38b375eec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_logs_changes" ADD CONSTRAINT "FK_54f1c5e7cd44f74f86e9095a74a" FOREIGN KEY ("log_id") REFERENCES "data_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_logs_changes" DROP CONSTRAINT "FK_54f1c5e7cd44f74f86e9095a74a"`);
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_a283f37e08edf5e37d38b375eec"`);
        await queryRunner.query(`ALTER TABLE "user_passwords" DROP CONSTRAINT "FK_69bf155ad044d776976470eb032"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_26d387f3e8de5b59428adbbc828"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_e769615ca479c63a2ff8a2a54d8"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_ac270d32a01ee22d2e98a8f8532"`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "user_agent" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "ip_address" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "device_info" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "data_logs_changes" ADD CONSTRAINT "FK_54f1c5e7cd44f74f86e9095a74a" FOREIGN KEY ("log_id") REFERENCES "data_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_activities" ADD CONSTRAINT "FK_a283f37e08edf5e37d38b375eec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_passwords" ADD CONSTRAINT "FK_69bf155ad044d776976470eb032" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_26d387f3e8de5b59428adbbc828" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_e769615ca479c63a2ff8a2a54d8" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_ac270d32a01ee22d2e98a8f8532" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
