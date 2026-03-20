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

import config from '../../../config';
import { ExternalFilesEntity } from '../entities/external-files.entity';
import { ExternalFilesService } from '../external-files.service';

const cronConfig = config().cron;

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
    if (cronConfig.missedFilesEnabled) {
      await this.queueService.schedule('process-missing-files', cronConfig.missedFilesRule!);
      await this.queueService.work('process-missing-files', () => this.processMissingFiles());
    }
    if (cronConfig.unlinkedFilesEnabled) {
      await this.queueService.schedule('process-unlinked-files', cronConfig.unlinkedFilesRule!);
      await this.queueService.work('process-unlinked-files', () => this.processUnlinkFiles());
    }
  }

  public async processMissingFiles() {
    const type = LoggingTypes.cleanupMissingFiles;
    try {
      const { onlyInDir, onlyInDbIds } = await this.externalFilesService.cleanup();

      if (onlyInDir.length > 0 || onlyInDbIds.length > 0) {
        await Promise.all(
          onlyInDir.map(async (fileName) => {
            const filePath = path.join(this.basePath, fileName);
            await fs.promises.unlink(filePath);
          }),
        );
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
        await Promise.all(
          toUnlink.map(async (externalFile) => {
            const filePath = path.join(this.basePath, externalFile.externalId);
            if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
          }),
        );

        this.logger.info({ type, data: { toUnlinkIds } }, `Unlinked ${toUnlinkIds.length} files`);
      }
    } catch (e: unknown) {
      const error = e as Error;
      this.logger.error({ type, stack: getErrorStack(error) }, error.message || `Failed to process unlink files.`);
      throw e;
    }
  }
}
