import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import Joi from 'joi';
import { SecurityModule } from 'src/security/security.module';

import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { entities } from './common/entities';
import { GlobalThrottlerGuard } from './common/guards/global-throttler.guard';
import { migrations } from './common/migrations';
import { QueueModule } from './common/queue/queue.module';
import { subscribers } from './common/subscribers';
import { ContactsModule } from './contacts/contacts.module';
import { EmailModule } from './email/email.module';
import { ExternalFilesModule } from './external-files/external-files.module';
import { GroupsModule } from './groups/groups.module';
import { HealthModule } from './health/health.module';
import { LoggingModule } from './logging/logging.module';
import { DeviceInfoMiddleware } from './middleware/device-info.middleware';
import { NotificationsModule } from './notifications/notifications.module';
import { PostgresModule } from './postgres/postgres.module';
import { UserActivitiesModule } from './user-activities/user-activities.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    QueueModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env`],
      validationSchema: Joi.object({
        // General
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().required(),
        TRUST_PROXY: Joi.string().optional().allow('0', '1', 'true', 'false'),
        API_DOCS_ENABLED: Joi.string().optional().default('false').allow('true', 'false'),
        THROTTLER_ENABLED: Joi.string().optional().default('true').allow('true', 'false'),
        DEV_SEND_PUSH_TO_SENDER: Joi.boolean().optional().default(false),
        // PostgreSQL
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASS: Joi.string().required(),
        POSTGRES_DB_NAME: Joi.string().required(),
        POSTGRES_IS_LOGGING_ENABLED: Joi.string().optional().default('false').allow('true', 'false'),
        POSTGRES_SSL: Joi.string().optional().default('false').allow('true', 'false'),
        // Logger (PostgreSQL)
        LOG_DB_ENABLED: Joi.string().optional().default('true').allow('true', 'false'),
        LOG_DB_HOST: Joi.string().when('LOG_DB_ENABLED', { is: 'true', then: Joi.required(), otherwise: Joi.optional() }),
        LOG_DB_PORT: Joi.number().when('LOG_DB_ENABLED', { is: 'true', then: Joi.required(), otherwise: Joi.optional() }),
        LOG_DB_USER: Joi.string().when('LOG_DB_ENABLED', { is: 'true', then: Joi.required(), otherwise: Joi.optional() }),
        LOG_DB_PASS: Joi.string().when('LOG_DB_ENABLED', { is: 'true', then: Joi.required(), otherwise: Joi.optional() }),
        LOG_DB_NAME: Joi.string().when('LOG_DB_ENABLED', { is: 'true', then: Joi.required(), otherwise: Joi.optional() }),
        LOG_DB_TABLE: Joi.string().when('LOG_DB_ENABLED', { is: 'true', then: Joi.required(), otherwise: Joi.optional() }),
        LOG_DB_SSL: Joi.string().optional().default('false').allow('true', 'false'),
        LOG_STD_OUT: Joi.string().optional().default('false').allow('true', 'false'),
        LOG_LEVEL: Joi.string().optional().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal'),
        // Security
        SERVER_SECRET: Joi.string().required(),
        SERVER_SALT: Joi.string().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        ACCESS_TOKEN_TTL: Joi.number().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_TTL: Joi.number().required(),
        MAX_FAILED_LOGIN_ATTEMPTS: Joi.number().optional().default(5),

        // Confirmations
        RESET_PASSWORD_TOKEN_TTL: Joi.number().required(),
        SETUP_PASSWORD_TOKEN_TTL: Joi.number().required(),

        // Email
        EMAIL_FROM: Joi.string().email().required(),
        RESEND_API_KEY: Joi.string().required(),

        // Cron job variables
        CRON_MISSED_FILES_ENABLED: Joi.string().allow('true', 'false').required(),
        CRON_MISSED_FILES_RULE: Joi.string().when('CRON_MISSED_FILES_ENABLED', {
          is: 'true',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        CRON_UNLINKED_FILES_ENABLED: Joi.string().allow('true', 'false').required(),
        CRON_UNLINKED_FILES_RULE: Joi.string().when('CRON_UNLINKED_FILES_ENABLED', {
          is: 'true',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        FIREBASE_PROJECT_ID: Joi.string().required(),
        FIREBASE_CLIENT_EMAIL: Joi.string().required(),
        FIREBASE_PRIVATE_KEY: Joi.string().required(),
        CRON_STATUS_REFRESH_RATE: Joi.string().optional().default('*/5 * * * *'),

        // Status & Roll-call
        STATUS_EXPIRY_SECONDS: Joi.number().default(8 * 60 * 60),
        ROLL_CALL_TIMEOUT_SECONDS: Joi.number().default(60 * 60),
        PERSONAL_ROLL_CALL_GRACE_SECONDS: Joi.number().default(15 * 60),

        // Alerts.in.ua
        ALERTS_TOKEN: Joi.string().required(),
        ALERTS_API_URL: Joi.string().required(),
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
    ContactsModule,
    NotificationsModule,
    HealthModule,
    AlertsModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GlobalThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceInfoMiddleware).forRoutes('{*path}');
  }
}
