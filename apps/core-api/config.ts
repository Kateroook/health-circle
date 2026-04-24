import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.join(process.cwd(), `.env`),
});

export default () => ({
  security: {
    defaultEmail: process.env.DEFAULT_USER_EMAIL!,
    defaultPassword: process.env.DEFAULT_USER_PASSWORD!,
    serverSecret: process.env.SERVER_SECRET!,
    serverSalt: process.env.SERVER_SALT!,
    passwordExpirationDays: process.env.PASSWORD_EXPIRATION_DAYS!,
  },
  db: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASS,
    database: process.env.POSTGRES_DB_NAME,
    ssl: process.env.POSTGRES_SSL === 'true',
  },
});
