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
  synchronize: false,
  logging: true,
  migrations: [process.cwd() + '/src/common/migrations/*.ts'],
  entities: [process.cwd() + '/src/common/entities/*.ts'],
  migrationsTableName: '_migrations',
  namingStrategy: new SnakeNamingStrategy(),
});
