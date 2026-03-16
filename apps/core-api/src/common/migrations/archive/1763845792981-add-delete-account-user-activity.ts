import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeleteAccountUserActivity1763845792981 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO dict_user_activity_types (code, label)
      VALUES ('delete_account', 'Delete account')
      ON CONFLICT (code) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM dict_user_activity_types
      WHERE code = 'delete_account';
    `);
  }
}
