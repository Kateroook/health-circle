import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarUpdatedAtToUser1771090489116 implements MigrationInterface {
  name = 'AddAvatarUpdatedAtToUser1771090489116';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar_updated_at" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_updated_at"`);
  }
}
