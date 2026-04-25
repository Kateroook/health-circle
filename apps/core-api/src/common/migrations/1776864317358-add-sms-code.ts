import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSmsCode1776864317358 implements MigrationInterface {
  name = 'AddSmsCode1776864317358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('users', 'sms_code');
    if (!hasColumn) {
      await queryRunner.query(`ALTER TABLE "users" ADD "sms_code" varchar`);
    }

    // Generate codes for existing users (even if column existed but was empty)
    const users = await queryRunner.query(`SELECT id FROM "users" WHERE "sms_code" IS NULL`);
    if (users.length > 0) {
      for (const user of users) {
        let code = '';
        let isUnique = false;
        while (!isUnique) {
          code = this.generateSmsCode();
          const existing = await queryRunner.query(`SELECT id FROM "users" WHERE "sms_code" = $1`, [code]);
          if (existing.length === 0) isUnique = true;
        }
        await queryRunner.query(`UPDATE "users" SET "sms_code" = $1 WHERE id = $2`, [code, user.id]);
      }
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_sms_code"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_sms_code" ON "users" ("sms_code") WHERE "sms_code" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "sms_code" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_sms_code"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "sms_code"`);
  }

  private generateSmsCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 10; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `HC-${suffix}`;
  }
}
