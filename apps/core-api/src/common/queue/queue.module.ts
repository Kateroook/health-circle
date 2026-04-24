import { Global, Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgBoss } from 'pg-boss';

import { QueueService } from './queue.service';

@Global()
@Module({
  providers: [
    {
      provide: 'PG_BOSS',
      useFactory: (configService: ConfigService) => {
        const host = configService.getOrThrow<string>('POSTGRES_HOST');
        const port = configService.getOrThrow<number>('POSTGRES_PORT');
        const user = configService.getOrThrow<string>('POSTGRES_USER');
        const pass = encodeURIComponent(configService.getOrThrow<string>('POSTGRES_PASS'));
        const dbName = configService.getOrThrow<string>('POSTGRES_DB_NAME');
        const ssl = configService.get<string>('POSTGRES_SSL') === 'true' ? { rejectUnauthorized: false } : false;
        const url = `postgres://${user}:${pass}@${host}:${port}/${dbName}`;

        return new PgBoss({
          connectionString: url,
          ssl,
        });
      },
      inject: [ConfigService],
    },
    QueueService,
  ],
  exports: ['PG_BOSS', QueueService],
})
export class QueueModule implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject('PG_BOSS') private readonly boss: PgBoss) {}

  async onModuleInit() {
    await this.boss.start();
  }

  async onModuleDestroy() {
    await this.boss.stop();
  }
}
