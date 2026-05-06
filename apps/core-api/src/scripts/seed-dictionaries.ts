import 'dotenv/config';

import * as path from 'path';
import { DataSource } from 'typeorm';

import { UserActivityTypes } from '../common/enums/user-activity-types';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASS || 'password',
  database: process.env.POSTGRES_DB_NAME || 'health_circle',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
});

async function seedUserActivityTypes(dataSource: DataSource) {
  const data = [
    { code: UserActivityTypes.userLogin, label: 'User Login' },
    { code: UserActivityTypes.userLogout, label: 'User Logout' },
    { code: UserActivityTypes.createUser, label: 'Create User' },
    { code: UserActivityTypes.modifyUser, label: 'Modify User' },
    { code: UserActivityTypes.deleteAccount, label: 'Delete Account' },
    { code: UserActivityTypes.userFailedLogin, label: 'User Failed Login' },
    { code: UserActivityTypes.userResetPass, label: 'User Reset Password' },
  ];

  console.log(`Seeding ${data.length} user activity types...`);

  for (const item of data) {
    await dataSource.query(
      `
      INSERT INTO "dict_user_activity_types" ("code", "label")
      VALUES ($1, $2)
      ON CONFLICT ("code") DO UPDATE SET "label" = $2;
    `,
      [item.code, item.label],
    );
  }
}

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized.');

    await seedUserActivityTypes(AppDataSource);

    console.log('All dictionaries seeded successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch(console.error);
