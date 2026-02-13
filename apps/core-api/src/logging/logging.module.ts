import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INFO, levelFromName, Stream } from 'bunyan';
import { BunyanLoggerModule } from 'nestjs-bunyan';

import { PostgresStream } from './postgres.stream';

@Module({
  imports: [
    BunyanLoggerModule.forRootAsync({
      isGlobal: true,
      bunyan: {
        useFactory: (configService: ConfigService) => {
          const streams: Stream[] = [];

          const logLevelName = configService.get<string>('LOG_LEVEL') || 'info';
          const logLevel = (levelFromName as unknown as Record<string, number>)[logLevelName.toLowerCase()] || INFO;
          streams.push({
            stream: new PostgresStream({
              connection: {
                host: configService.get<string>('LOG_DB_HOST')!,
                port: configService.get<number>('LOG_DB_PORT')!,
                user: configService.get<string>('LOG_DB_USER')!,
                password: configService.get<string>('LOG_DB_PASS')!,
                database: configService.get<string>('LOG_DB_NAME')!,
              },
              tableName: configService.get<string>('LOG_DB_TABLE')!,
            }),
            level: logLevel,
          });

          if (configService.get<string>('LOG_STD_OUT') === 'true') {
            streams.push({
              stream: process.stdout,
              level: logLevel,
            });
          }

          return {
            src: true,
            name: 'app',
            streams,
          };
        },
        inject: [ConfigService],
      },
    }),
  ],
  exports: [BunyanLoggerModule],
})
export class LoggingModule {}
