import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import config from './config';

const db = config().db;
export default new DataSource({
  type: 'postgres',
  host: db.host,
  port: +db.port!,
  username: db.username,
  password: db.password,
  database: db.database,
  ssl: db.ssl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: true,
  migrations: [process.cwd() + '/src/common/migrations/*.ts'],
  entities: [process.cwd() + '/src/**/*.entity.ts'],
  migrationsTableName: '_migrations',
  namingStrategy: new SnakeNamingStrategy(),
});
