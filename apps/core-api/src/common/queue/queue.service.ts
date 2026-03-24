import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PgBoss, ScheduleOptions, SendOptions, WorkHandler } from 'pg-boss';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly initialized = new Set<string>();
  private readonly initializing = new Map<string, Promise<void>>();

  constructor(@Inject('PG_BOSS') private readonly boss: PgBoss) {}

  private async ensureQueue(name: string): Promise<void> {
    if (this.initialized.has(name)) return;

    const existing = this.initializing.get(name);
    if (existing) return existing;

    const initPromise = (async () => {
      await this.boss.createQueue(name);
      this.initialized.add(name);
    })();

    this.initializing.set(name, initPromise);
    try {
      await initPromise;
    } finally {
      this.initializing.delete(name);
    }
  }

  async send(name: string, data: any, options?: SendOptions) {
    this.logger.debug(`Sending job ${name}`);
    await this.ensureQueue(name);
    return this.boss.send(name, data, options);
  }

  async work<T>(name: string, handler: WorkHandler<T>) {
    this.logger.debug(`Starting worker for ${name}`);
    await this.ensureQueue(name);
    return this.boss.work(name, handler);
  }

  async schedule(name: string, cron: string, data?: any, options?: ScheduleOptions) {
    this.logger.debug(`Scheduling job ${name} with cron ${cron}`);
    await this.ensureQueue(name);
    return this.boss.schedule(name, cron, data, options);
  }
}
