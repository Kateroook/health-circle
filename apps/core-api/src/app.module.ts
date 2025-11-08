import KeyvRedis from '@keyv/redis';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';

import { CacheModule } from '@nestjs/cache-manager';
import { SecurityModule } from 'security/security.module';
import { AuthModule } from './auth/auth.module';
import { entities } from './common/entities';
import { migrations } from './common/migrations';
import { subscribers } from './common/subscribers';
import { EmailModule } from './email/email.module';
import { LoggingModule } from './logging/logging.module';
import { DeviceInfoMiddleware } from './middleware/device-info.middleware';
import { PostgresModule } from './postgres/postgres.module';
import { UserActivitiesModule } from './user-activities/user-activities.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env`],
      validationSchema: Joi.object({
        // General
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().required(),
        API_DOCS_ENABLED: Joi.string().optional().default('false').allow('true', 'false'),
        // PostgreSQL
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASS: Joi.string().required(),
        POSTGRES_DB_NAME: Joi.string().required(),
        POSTGRES_IS_LOGGING_ENABLED: Joi.string().optional().default('false').allow('true', 'false'),
        // Logger (PostgreSQL)
        LOG_DB_HOST: Joi.string().required(),
        LOG_DB_PORT: Joi.number().required(),
        LOG_DB_USER: Joi.string().required(),
        LOG_DB_PASS: Joi.string().required(),
        LOG_DB_NAME: Joi.string().required(),
        LOG_DB_TABLE: Joi.string().required(),
        LOG_STD_OUT: Joi.string().optional().default('false').allow('true', 'false'),
        LOG_LEVEL: Joi.string().optional().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal'),
        // Security
        SERVER_SECRET: Joi.string().required(),
        SERVER_SALT: Joi.string().required(),

        // Email
        EMAIL_HOST: Joi.string().required(),
        EMAIL_PORT: Joi.number().required(),
        EMAIL_USER: Joi.string().required(),
        EMAIL_PASS: Joi.string().required(),
      }),
    }),
    PostgresModule.register(entities, migrations, subscribers),
    AuthModule,
    UsersModule,
    LoggingModule,
    EmailModule,
    UserActivitiesModule,
    SecurityModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');
        const redis = new KeyvRedis({ socket: { host, port }, password, database: 2 });
        redis.on('error', (err) => {
          console.error('Redis Connection Error:', err);
        });
        return { stores: [redis] };
      },
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceInfoMiddleware).forRoutes('*path');
  }
}
