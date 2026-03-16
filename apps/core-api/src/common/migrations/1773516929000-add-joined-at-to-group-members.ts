import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJoinedAtToGroupMembers1773516929000 implements MigrationInterface {
  name = 'AddJoinedAtToGroupMembers1773516929000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_members" ADD COLUMN IF NOT EXISTS "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group_members" DROP COLUMN IF EXISTS "joined_at"`);
  }
}
