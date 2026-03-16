import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterEntities1762550449323 implements MigrationInterface {
  name = 'AlterEntities1762550449323';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_passwords" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password_hash" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, CONSTRAINT "PK_4244bafe3ae2988e7bb7af61268" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_69bf155ad044d776976470eb03" ON "user_passwords" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_f84ad812dd65e014fe757a9a39" ON "user_passwords" ("created_at") `);
    await queryRunner.query(
      `CREATE TABLE "dict_user_activity_types" ("code" character varying(64) NOT NULL, "label" character varying(255) NOT NULL, CONSTRAINT "PK_b8865a5b6a07a161707158a7b14" PRIMARY KEY ("code"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_info" json NOT NULL, "ip_address" character varying(45) NOT NULL, "user_agent" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "action_code" character varying(64) NOT NULL, "user_id" uuid NOT NULL, "sub_user_id" uuid, CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a283f37e08edf5e37d38b375ee" ON "user_activities" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_409290fd515e7da12712434e07" ON "user_activities" ("sub_user_id") `);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "revoked_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "user_agent"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "user_agent" character varying(512) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "ip_address"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "ip_address" character varying(16) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "jti"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "jti" character varying(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "token_hash"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "token_hash" character varying(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "device_info"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "device_info" jsonb NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ALTER COLUMN "user_id" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_e9658e959c490b0a634dfc5478" ON "user_sessions" ("user_id") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_705c76591465aa6943b60551cd" ON "user_sessions" ("jti") `);
    await queryRunner.query(`CREATE INDEX "IDX_6596adb3b8927b35bda97e734a" ON "user_sessions" ("token_hash") `);
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_passwords" ADD CONSTRAINT "FK_69bf155ad044d776976470eb032" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_activities" ADD CONSTRAINT "FK_b2aa8f9ba59bfcd6751fd3a4719" FOREIGN KEY ("action_code") REFERENCES "dict_user_activity_types"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_activities" ADD CONSTRAINT "FK_a283f37e08edf5e37d38b375eec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_activities" ADD CONSTRAINT "FK_409290fd515e7da12712434e074" FOREIGN KEY ("sub_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_409290fd515e7da12712434e074"`);
    await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_a283f37e08edf5e37d38b375eec"`);
    await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_b2aa8f9ba59bfcd6751fd3a4719"`);
    await queryRunner.query(`ALTER TABLE "user_passwords" DROP CONSTRAINT "FK_69bf155ad044d776976470eb032"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6596adb3b8927b35bda97e734a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_705c76591465aa6943b60551cd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e9658e959c490b0a634dfc5478"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ALTER COLUMN "user_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "device_info"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "device_info" character varying`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "token_hash"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "token_hash" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "jti"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "jti" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "ip_address"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "ip_address" character varying`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "user_agent"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD "user_agent" character varying`);
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "revoked_at"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "expires_at"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_409290fd515e7da12712434e07"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a283f37e08edf5e37d38b375ee"`);
    await queryRunner.query(`DROP TABLE "user_activities"`);
    await queryRunner.query(`DROP TABLE "dict_user_activity_types"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f84ad812dd65e014fe757a9a39"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_69bf155ad044d776976470eb03"`);
    await queryRunner.query(`DROP TABLE "user_passwords"`);
  }
}
