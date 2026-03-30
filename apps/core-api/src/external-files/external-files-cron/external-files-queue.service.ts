import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as path from 'path';
import { LoggingTypes } from 'src/common/enums/logging-types';
import { getErrorStack } from 'src/common/helpers/get-error-stack.util';
import { QueueService } from 'src/common/queue/queue.service';
import { In, IsNull, Not, Repository } from 'typeorm';

import { ExternalFilesEntity } from '../entities/external-files.entity';
import { ExternalFilesService } from '../external-files.service';

@Injectable()
export class ExternalFilesQueueService implements OnModuleInit {
  private readonly basePath: string;

  constructor(
    @InjectRepository(ExternalFilesEntity)
    private readonly repository: Repository<ExternalFilesEntity>,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly externalFilesService: ExternalFilesService,
    @InjectPinoLogger(ExternalFilesQueueService.name)
    private readonly logger: PinoLogger,
  ) {
    this.basePath = configService.get<string>('EXTERNAL_FILES_PATH')!;
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async onModuleInit() {
    const missedFilesEnabled = this.configService.get<string>('CRON_MISSED_FILES_ENABLED') === 'true';
    const unlinkedFilesEnabled = this.configService.get<string>('CRON_UNLINKED_FILES_ENABLED') === 'true';

    if (missedFilesEnabled) {
      const rule = this.configService.getOrThrow<string>('CRON_MISSED_FILES_RULE');
      await this.queueService.schedule('process-missing-files', rule);
      await this.queueService.work('process-missing-files', () => this.processMissingFiles());
    }

    if (unlinkedFilesEnabled) {
      const rule = this.configService.getOrThrow<string>('CRON_UNLINKED_FILES_RULE');
      await this.queueService.schedule('process-unlinked-files', rule);
      await this.queueService.work('process-unlinked-files', () => this.processUnlinkFiles());
    }
  }

  public async processMissingFiles() {
    const type = LoggingTypes.cleanupMissingFiles;
    try {
      const { onlyInDir, onlyInDbIds } = await this.externalFilesService.cleanup();

      if (onlyInDir.length > 0 || onlyInDbIds.length > 0) {
        // Chunk file deletions to avoid spikes in filesystem/event loop
        const chunkSize = 100;
        for (let i = 0; i < onlyInDir.length; i += chunkSize) {
          const chunk = onlyInDir.slice(i, i + chunkSize);
          await Promise.allSettled(
            chunk.map(async (fileName) => {
              const filePath = path.join(this.basePath, fileName);
              try {
                await fs.promises.unlink(filePath);
              } catch (err) {
                this.logger.error({ type, fileName, err }, `Failed to unlink missing file ${fileName}`);
              }
            }),
          );
        }
        if (onlyInDbIds.length > 0) {
          await this.repository.update(
            { id: In(onlyInDbIds) },
            {
              deletedAt: new Date(),
              unlinkAt: new Date(),
            },
          );
        }
        this.logger.info(
          { type, data: { onlyInDir, onlyInDbIds } },
          `Deleted ${onlyInDir.length} files, Updated ${onlyInDbIds.length} entities`,
        );
      }
    } catch (e: unknown) {
      const error = e as Error;
      this.logger.error({ type, stack: getErrorStack(error) }, error.message || `Failed to process missing files.`);
      throw e; // pg-boss will handle retries
    }
  }

  public async processUnlinkFiles() {
    const type = LoggingTypes.unlinkMissingFiles;
    try {
      const toUnlink = await this.repository.find({ where: { unlinkAt: IsNull(), deletedAt: Not(IsNull()) }, withDeleted: true });
      const toUnlinkIds = toUnlink.map((u) => u.id);

      if (toUnlinkIds.length > 0) {
        await this.repository.update(
          { id: In(toUnlinkIds) },
          {
            unlinkAt: new Date(),
          },
        );
        // Chunk file unlinking to avoid spikes
        const chunkSize = 100;
        for (let i = 0; i < toUnlink.length; i += chunkSize) {
          const chunk = toUnlink.slice(i, i + chunkSize);
          await Promise.allSettled(
            chunk.map(async (externalFile) => {
              const filePath = path.join(this.basePath, externalFile.externalId);
              try {
                if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
              } catch (err) {
                this.logger.error(
                  { type, externalId: externalFile.externalId, err },
                  `Failed to unlink file ${externalFile.externalId}`,
                );
              }
            }),
          );
        }

        this.logger.info({ type, data: { toUnlinkIds } }, `Unlinked ${toUnlinkIds.length} files`);
      }
    } catch (e: unknown) {
      const error = e as Error;
      this.logger.error({ type, stack: getErrorStack(error) }, error.message || `Failed to process unlink files.`);
      throw e;
    }
  }
}
