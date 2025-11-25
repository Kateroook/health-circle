import KeyvRedis from '@keyv/redis';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';

import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { SecurityModule } from 'src/security/security.module';
import { AuthModule } from './auth/auth.module';
import { entities } from './common/entities';
import { migrations } from './common/migrations';
import { subscribers } from './common/subscribers';
import { EmailModule } from './email/email.module';
import { ExternalFilesModule } from './external-files/external-files.module';
import { GroupsModule } from './groups/groups.module';
import { LoggingModule } from './logging/logging.module';
import { DeviceInfoMiddleware } from './middleware/device-info.middleware';
import { PostgresModule } from './postgres/postgres.module';
import { UserActivitiesModule } from './user-activities/user-activities.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

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

        // FILES
        EXTERNAL_FILES_PATH: Joi.string().required(),
        // Cron job variables
        CRON_MISSED_FILES_ENABLED: Joi.boolean().required(),
        CRON_MISSED_FILES_RULE: Joi.string().when('CRON_MISSED_FILES_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        CRON_UNLINKED_FILES_ENABLED: Joi.boolean().required(),
        CRON_UNLINKED_FILES_RULE: Joi.string().when('CRON_UNLINKED_FILES_ENABLED', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
      }),
    }),
    PostgresModule.register(entities, migrations, subscribers),
    AuthModule,
    UsersModule,
    LoggingModule,
    EmailModule,
    UserActivitiesModule,
    SecurityModule,
    GroupsModule,
    ExternalFilesModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        const password = configService.get<string>('REDIS_PASSWORD');
        const redis = new KeyvRedis({ socket: { host, port }, password, database: 3 });
        redis.on('error', (err) => {
          console.error('Redis Connection Error:', err);
        });
        return { stores: [redis] };
      },
    }),
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceInfoMiddleware).forRoutes('*path');
  }
}
