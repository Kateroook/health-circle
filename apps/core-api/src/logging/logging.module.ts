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
        const streams: { stream: NodeJS.WritableStream }[] = [];
        const pino = require('pino'); 

        const logLevel = configService.get<string>('LOG_LEVEL') || 'info';
        
        const destinationStreams: any[] = [];

        // Postgres Stream
        destinationStreams.push({
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

        // Stdout Stream
        if (configService.get<string>('LOG_STD_OUT') === 'true') {
           if (process.env.NODE_ENV !== 'production') {
             destinationStreams.push({
                stream: require('pino-pretty')(),
                level: logLevel
             });
           } else {
             destinationStreams.push({
               stream: process.stdout,
               level: logLevel
             });
           }
        }
        
        return {
          pinoHttp: {
            name: 'health-circle-core-api', // Or 'app', checking previous config it was 'app'
            level: logLevel,
            stream: pino.multistream(destinationStreams),
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
