/* eslint-disable */
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { PostgresStream } from './postgres.stream';

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pino = require('pino');

        const logLevel = configService.get<string>('LOG_LEVEL') || 'info';
        const isDbLoggingEnabled = configService.get<string>('LOG_DB_ENABLED') !== 'false';

        const destinationStreams: unknown[] = [];

        // Postgres Stream
        if (isDbLoggingEnabled) {
          destinationStreams.push({
            stream: new PostgresStream({
              connection: {
                host: configService.getOrThrow<string>('LOG_DB_HOST'),
                port: configService.getOrThrow<number>('LOG_DB_PORT'),
                user: configService.getOrThrow<string>('LOG_DB_USER'),
                password: configService.getOrThrow<string>('LOG_DB_PASS'),
                database: configService.getOrThrow<string>('LOG_DB_NAME'),
                ssl: configService.get<string>('LOG_DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
              },
              tableName: configService.getOrThrow<string>('LOG_DB_TABLE'),
            }),
            level: logLevel,
          });
        }

        // Stdout Stream
        if (configService.get<string>('LOG_STD_OUT') === 'true') {
          if (process.env.NODE_ENV !== 'production') {
            destinationStreams.push({
              stream: require('pino-pretty')(),
              level: logLevel,
            });
          } else {
            destinationStreams.push({
              stream: process.stdout,
              level: logLevel,
            });
          }
        }

        const stream = destinationStreams.length > 0 ? pino.multistream(destinationStreams) : undefined;

        return {
          pinoHttp: {
            name: 'health-circle-core-api',
            level: logLevel,
            ...(stream ? { stream } : {}),
            autoLogging: true,
            serializers: {
              req: (req) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
            },
          },
        };
      },
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
