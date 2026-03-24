import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { DetectResult } from 'node-device-detector';
import { Repository } from 'typeorm';

import { UserSessionEntity } from './entities/user-sessions.entity';

@Injectable()
export class SessionActivityService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionActivityService.name);
  private updates = new Map<string, { lastUsedAt: Date; ipAddress: string; deviceInfo: DetectResult | undefined }>();
  private interval: NodeJS.Timeout;

  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly sessionRepository: Repository<UserSessionEntity>,
  ) {
    this.interval = setInterval(() => void this.flush(), 30000); // Flush every 30s
  }

  onModuleDestroy() {
    clearInterval(this.interval);
    void this.flush();
  }

  trackActivity(sessionId: string, ipAddress: string, deviceInfo: DetectResult | undefined) {
    this.updates.set(sessionId, {
      lastUsedAt: new Date(),
      ipAddress,
      deviceInfo,
    });
  }

  async flush() {
    if (this.updates.size === 0) return;

    const entries = Array.from(this.updates.entries());
    this.updates.clear();

    this.logger.debug(`Flushing ${entries.length} session activity updates`);

    // Process in chunks to avoid spiking database concurrency
    const chunkSize = 50;
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      await Promise.allSettled(
        chunk.map(([id, data]) =>
          this.sessionRepository
            .update(id, {
              lastUsedAt: data.lastUsedAt,
              ipAddress: data.ipAddress,
              deviceInfo: data.deviceInfo,
            })
            .catch((err) => this.logger.error(`Failed to update session ${id}`, err)),
        ),
      );
    }
  }
}
