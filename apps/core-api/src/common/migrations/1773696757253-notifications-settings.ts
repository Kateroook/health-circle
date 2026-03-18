import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationsSettings1773696757253 implements MigrationInterface {
  name = 'NotificationsSettings1773696757253';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_notification_settings" ("user_id" uuid NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "prefs" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_52182ffd0f785e8256f8fcb4fd6" PRIMARY KEY ("user_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_notification_settings"`);
  }
}
