import { MigrationInterface, QueryRunner } from 'typeorm';

import { UserActivityTypes } from '../../enums/user-activity-types';

export class CreateDataLogsEntity1762594452409 implements MigrationInterface {
  name = 'CreateDataLogsEntity1762594452409';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_409290fd515e7da12712434e074"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_409290fd515e7da12712434e07"`);
    await queryRunner.query(
      `CREATE TABLE "data_logs_changes" ("id" SERIAL NOT NULL, "property_name" character varying(64), "old_value" character varying(65535), "new_value" character varying(65535), "value_type" character varying(64), "log_id" integer NOT NULL, CONSTRAINT "PK_31eb51ad4e958e35658ef4aad1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "data_logs" ("id" SERIAL NOT NULL, "entity_name" character varying(64) NOT NULL, "table_name" character varying(64) NOT NULL, "record_id" integer, "record_code" character varying(64), "record_uuid" uuid, "log_type" character varying(64) NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid, CONSTRAINT "PK_aec147a7e003a34933f70bc2596" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "user_activities" DROP COLUMN "sub_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "data_logs_changes" ADD CONSTRAINT "FK_54f1c5e7cd44f74f86e9095a74a" FOREIGN KEY ("log_id") REFERENCES "data_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "data_logs" ADD CONSTRAINT "FK_28d5ea2b767ed4c38ae3d6d93aa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
        INSERT INTO dict_user_activity_types (code, label) VALUES
            ('user_registered', 'User Registered'),
            ('${UserActivityTypes.userLogin}', 'User Login'),
            ('${UserActivityTypes.userLogout}', 'User Logout'),
            ('${UserActivityTypes.createUser}', 'Create User'),
            ('${UserActivityTypes.modifyUser}', 'Modify User'),
            ('${UserActivityTypes.userFailedLogin}', 'User Failed Login'),
            ('${UserActivityTypes.userResetPass}', 'User Reset Password');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_logs" DROP CONSTRAINT "FK_28d5ea2b767ed4c38ae3d6d93aa"`);
    await queryRunner.query(`ALTER TABLE "data_logs_changes" DROP CONSTRAINT "FK_54f1c5e7cd44f74f86e9095a74a"`);
    await queryRunner.query(`ALTER TABLE "user_activities" ADD "sub_user_id" uuid`);
    await queryRunner.query(`DROP TABLE "data_logs"`);
    await queryRunner.query(`DROP TABLE "data_logs_changes"`);
    await queryRunner.query(`CREATE INDEX "IDX_409290fd515e7da12712434e07" ON "user_activities" ("sub_user_id") `);
    await queryRunner.query(
      `ALTER TABLE "user_activities" ADD CONSTRAINT "FK_409290fd515e7da12712434e074" FOREIGN KEY ("sub_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
