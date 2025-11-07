import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

import { entities } from './common/entities';
import { migrations } from './common/migrations';
import { PostgresModule } from './postgres/postgres.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env`],
      validationSchema: Joi.object({
        // General
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .required(),
        PORT: Joi.number().required(),
        API_DOCS_ENABLED: Joi.string()
          .optional()
          .default('false')
          .allow('true', 'false'),
        // PostgreSQL
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASS: Joi.string().required(),
        POSTGRES_DB_NAME: Joi.string().required(),
        POSTGRES_IS_LOGGING_ENABLED: Joi.string()
          .optional()
          .default('false')
          .allow('true', 'false'),
        // Logger (PostgreSQL)
        LOG_DB_HOST: Joi.string().required(),
        LOG_DB_PORT: Joi.number().required(),
        LOG_DB_USER: Joi.string().required(),
        LOG_DB_PASS: Joi.string().required(),
        LOG_DB_NAME: Joi.string().required(),
        LOG_DB_TABLE: Joi.string().required(),
        LOG_STD_OUT: Joi.string()
          .optional()
          .default('false')
          .allow('true', 'false'),
        LOG_LEVEL: Joi.string()
          .optional()
          .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal'),
        // Security
        SERVER_SECRET: Joi.string().required(),
        SERVER_SALT: Joi.string().required(),
      }),
    }),
    PostgresModule.register(entities, migrations),
  ],
})
export class AppModule {}
