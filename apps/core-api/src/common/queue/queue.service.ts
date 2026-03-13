import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PgBoss, ScheduleOptions, SendOptions, WorkHandler } from 'pg-boss';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@Inject('PG_BOSS') private readonly boss: PgBoss) {}

  async send(name: string, data: any, options?: SendOptions) {
    this.logger.debug(`Sending job ${name}`);
    await this.boss.createQueue(name);
    return this.boss.send(name, data, options);
  }

  async work<T>(name: string, handler: WorkHandler<T>) {
    this.logger.debug(`Starting worker for ${name}`);
    await this.boss.createQueue(name);
    return this.boss.work(name, handler);
  }

  async schedule(name: string, cron: string, data?: any, options?: ScheduleOptions) {
    this.logger.debug(`Scheduling job ${name} with cron ${cron}`);
    await this.boss.createQueue(name);
    return this.boss.schedule(name, cron, data, options);
  }
}
