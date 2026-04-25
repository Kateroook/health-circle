/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({})
export class PostgresModule {
  static register(entities: Function[], migrations: Function[], subscribers: Function[]): DynamicModule {
    return {
      module: PostgresModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
            type: 'postgres',
            host: configService.getOrThrow<string>('POSTGRES_HOST'),
            port: configService.getOrThrow<number>('POSTGRES_PORT'),
            username: configService.getOrThrow<string>('POSTGRES_USER'),
            password: configService.getOrThrow<string>('POSTGRES_PASS'),
            database: configService.getOrThrow<string>('POSTGRES_DB_NAME'),
            logging: configService.getOrThrow<string>('POSTGRES_IS_LOGGING_ENABLED') === 'true',
            ssl: configService.get<string>('POSTGRES_SSL') === 'true' ? { rejectUnauthorized: false } : false,
            migrationsTableName: '_migrations',
            logger: 'advanced-console',
            migrations,
            entities,
            subscribers,
            migrationsRun: true,
            synchronize: false,
            namingStrategy: new SnakeNamingStrategy(),
            extra: {
              max: configService.get<number>('POSTGRES_MAX_POOL', 5),
            },
          }),
          inject: [ConfigService],
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}
