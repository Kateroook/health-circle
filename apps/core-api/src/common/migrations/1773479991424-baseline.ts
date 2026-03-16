import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseline1773479991424 implements MigrationInterface {
  name = 'Baseline1773479991424';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "external_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_name" text NOT NULL, "external_id" text NOT NULL, "md5" text NOT NULL, "size" integer NOT NULL, "mimetype" text NOT NULL, "unlink_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_07c9eb4c11f9e132ee8b37b0d60" UNIQUE ("external_id"), CONSTRAINT "PK_129e17eb3061aff8cb5a826e133" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_agent" character varying(512) NOT NULL, "ip_address" character varying(64) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "jti" character varying(255) NOT NULL, "token_hash" character varying(255) NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "last_used_at" TIMESTAMP WITH TIME ZONE, "fingerprint" character varying(64), "device_info" jsonb NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_e9658e959c490b0a634dfc5478" ON "user_sessions" ("user_id") `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_705c76591465aa6943b60551cd" ON "user_sessions" ("jti") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_6596adb3b8927b35bda97e734a" ON "user_sessions" ("token_hash") `);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "fingerprint" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "device_info" jsonb NOT NULL DEFAULT '{}'`);
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_status_enum') THEN CREATE TYPE "public"."users_status_enum" AS ENUM('SAFE', 'WAS_SAFE', 'DANGER', 'UNKNOWN'); END IF; END$$;`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "middle_name" character varying(100), "last_name" character varying(100) NOT NULL, "full_name" character varying(255), "email" character varying, "phone" character varying, "last_login_date" TIMESTAMP WITH TIME ZONE, "status" "public"."users_status_enum" NOT NULL DEFAULT 'UNKNOWN', "fcm_token" character varying, "last_status_update" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "failed_login_attempts" integer NOT NULL DEFAULT '0', "region" character varying, "last_personal_roll_call_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "locked_at" TIMESTAMP WITH TIME ZONE, "avatar_updated_at" TIMESTAMP WITH TIME ZONE, "is_registered" boolean NOT NULL DEFAULT false, "file_id" uuid, CONSTRAINT "REL_a367444399d0404c15d7dffdb0" UNIQUE ("file_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_e2dd77cb8a46c78d8ea34de039" ON "users" ("email") WHERE "email" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_875541f7dbe1b8565414f9f80b" ON "users" ("phone") WHERE "phone" IS NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_registered" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_updated_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "region" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_personal_roll_call_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confirmation_codes_type_enum') THEN CREATE TYPE "public"."confirmation_codes_type_enum" AS ENUM('REGISTRATION', 'PASSWORD_RESET'); END IF; END$$;`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "confirmation_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(255) NOT NULL, "type" "public"."confirmation_codes_type_enum" NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_a69728afe2297548351199d8984" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "target_id" uuid NOT NULL, "alias" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_0ea6df717232d78c1f98757f19" ON "contacts" ("owner_id", "target_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "data_logs_changes" ("id" SERIAL NOT NULL, "property_name" character varying(64), "old_value" character varying(65535), "new_value" character varying(65535), "value_type" character varying(64), "log_id" integer NOT NULL, CONSTRAINT "PK_31eb51ad4e958e35658ef4aad1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "data_logs" ("id" SERIAL NOT NULL, "entity_name" character varying(64) NOT NULL, "table_name" character varying(64) NOT NULL, "record_id" integer, "record_code" character varying(64), "record_uuid" uuid, "log_type" character varying(64) NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" uuid, CONSTRAINT "PK_aec147a7e003a34933f70bc2596" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "group_members" ("group_id" uuid NOT NULL, "user_id" uuid NOT NULL, "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f5939ee0ad233ad35e03f5c65c1" PRIMARY KEY ("group_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_f5939ee0ad233ad35e03f5c65c" ON "group_members" ("group_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "owner_id" uuid NOT NULL, "invite_code" character varying(32), "last_roll_call_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_aaeb14e9a2dade7d0fb0ee38b67" UNIQUE ("invite_code"), CONSTRAINT "PK_256aa0fda9b1de1a73ee0b7106b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "group_block_list" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f2a972c4e6c899897cdcc0a9876" UNIQUE ("group_id", "user_id"), CONSTRAINT "PK_83064a7ae531a6999e3991243f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "dict_user_activity_types" ("code" character varying(64) NOT NULL, "label" character varying(255) NOT NULL, CONSTRAINT "PK_b8865a5b6a07a161707158a7b14" PRIMARY KEY ("code"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_info" json, "ip_address" character varying(45), "user_agent" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "action_code" character varying(64) NOT NULL, "user_id" uuid, CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_a283f37e08edf5e37d38b375ee" ON "user_activities" ("user_id") `);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "user_passwords" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password_hash" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, CONSTRAINT "PK_4244bafe3ae2988e7bb7af61268" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_69bf155ad044d776976470eb03" ON "user_passwords" ("user_id") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_f84ad812dd65e014fe757a9a39" ON "user_passwords" ("created_at") `);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "_logs" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "level_code" smallint NOT NULL, "hostname" character varying(255) NOT NULL, "msg" text NOT NULL, "pid" integer NOT NULL, "time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, "status_code" smallint, "path" text, "func" character varying(255), "stack" jsonb, "data" jsonb, "type_code" character varying(255) DEFAULT 'other', CONSTRAINT "PK_e0028d82ef01d7a97300ad8ec1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_5c0d52a61dfa0d1d8ec3918b7d" ON "_logs" ("time") `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_706b6f46127475f3bd5ef1a734" ON "_logs" ("user_id") `);
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_e9658e959c490b0a634dfc54783') THEN ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_a367444399d0404c15d7dffdb02') THEN ALTER TABLE "users" ADD CONSTRAINT "FK_a367444399d0404c15d7dffdb02" FOREIGN KEY ("file_id") REFERENCES "external_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_fb179afebc1bcd8110f06ef51d3') THEN ALTER TABLE "confirmation_codes" ADD CONSTRAINT "FK_fb179afebc1bcd8110f06ef51d3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_54f1c5e7cd44f74f86e9095a74a') THEN ALTER TABLE "data_logs_changes" ADD CONSTRAINT "FK_54f1c5e7cd44f74f86e9095a74a" FOREIGN KEY ("log_id") REFERENCES "data_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_28d5ea2b767ed4c38ae3d6d93aa') THEN ALTER TABLE "data_logs" ADD CONSTRAINT "FK_28d5ea2b767ed4c38ae3d6d93aa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_2c840df5db52dc6b4a1b0b69c6e') THEN ALTER TABLE "group_members" ADD CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_c0caf7cfe48585ab1bbb91ef292') THEN ALTER TABLE "group_block_list" ADD CONSTRAINT "FK_c0caf7cfe48585ab1bbb91ef292" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_b2aa8f9ba59bfcd6751fd3a4719') THEN ALTER TABLE "user_activities" ADD CONSTRAINT "FK_b2aa8f9ba59bfcd6751fd3a4719" FOREIGN KEY ("action_code") REFERENCES "dict_user_activity_types"("code") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_a283f37e08edf5e37d38b375eec') THEN ALTER TABLE "user_activities" ADD CONSTRAINT "FK_a283f37e08edf5e37d38b375eec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION; END IF; END$$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_69bf155ad044d776976470eb032') THEN ALTER TABLE "user_passwords" ADD CONSTRAINT "FK_69bf155ad044d776976470eb032" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END$$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_passwords" DROP CONSTRAINT IF EXISTS "FK_69bf155ad044d776976470eb032"`);
    await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT IF EXISTS "FK_a283f37e08edf5e37d38b375eec"`);
    await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT IF EXISTS "FK_b2aa8f9ba59bfcd6751fd3a4719"`);
    await queryRunner.query(`ALTER TABLE "group_block_list" DROP CONSTRAINT IF EXISTS "FK_c0caf7cfe48585ab1bbb91ef292"`);
    await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT IF EXISTS "FK_2c840df5db52dc6b4a1b0b69c6e"`);
    await queryRunner.query(`ALTER TABLE "data_logs" DROP CONSTRAINT IF EXISTS "FK_28d5ea2b767ed4c38ae3d6d93aa"`);
    await queryRunner.query(`ALTER TABLE "data_logs_changes" DROP CONSTRAINT IF EXISTS "FK_54f1c5e7cd44f74f86e9095a74a"`);
    await queryRunner.query(`ALTER TABLE "confirmation_codes" DROP CONSTRAINT IF EXISTS "FK_fb179afebc1bcd8110f06ef51d3"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_a367444399d0404c15d7dffdb02"`);
    await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "FK_e9658e959c490b0a634dfc54783"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_706b6f46127475f3bd5ef1a734"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_5c0d52a61dfa0d1d8ec3918b7d"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "_logs"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f84ad812dd65e014fe757a9a39"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_69bf155ad044d776976470eb03"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_passwords"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_a283f37e08edf5e37d38b375ee"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_activities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dict_user_activity_types"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group_block_list"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_f5939ee0ad233ad35e03f5c65c"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "data_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "data_logs_changes"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_0ea6df717232d78c1f98757f19"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "confirmation_codes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."confirmation_codes_type_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_875541f7dbe1b8565414f9f80b"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e2dd77cb8a46c78d8ea34de039"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_status_enum"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_6596adb3b8927b35bda97e734a"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_705c76591465aa6943b60551cd"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_e9658e959c490b0a634dfc5478"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "external_files"`);
  }
}
