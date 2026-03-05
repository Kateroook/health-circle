import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as path from 'path';
import { ExternalFilesEntity } from 'src/common/entities/external-files.entity';
import { LoggingTypes } from 'src/common/enums/logging-types';
import { getErrorStack } from 'src/common/helpers/get-error-stack.util';
import { In, IsNull, Not, Repository } from 'typeorm';

import config from '../../../config';

const cronConfig = config().cron;

@Injectable()
export class ExternalFilesCronService {
  private readonly basePath: string;

  constructor(
    @InjectRepository(ExternalFilesEntity)
    private readonly repository: Repository<ExternalFilesEntity>,
    private readonly configService: ConfigService,
    @InjectPinoLogger(ExternalFilesCronService.name)
    private readonly logger: PinoLogger,
  ) {
    this.basePath = configService.get<string>('EXTERNAL_FILES_PATH')!;
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  @Cron(cronConfig.missedFilesRule!, { disabled: !cronConfig.missedFilesEnabled })
  public async processMissingFiles() {
    const type = LoggingTypes.cleanupMissingFiles;
    try {
      const dirFiles = await fs.promises.readdir(this.basePath);
      const dbFiles = await this.repository.find();

      const onlyInDir = dirFiles.filter((dirFile) => !dbFiles.some((dbFile) => dbFile.externalId === dirFile));
      const onlyInDb = dbFiles.filter((dbFile) => !dirFiles.includes(dbFile.externalId));
      const onlyInDbIds = onlyInDb.map((e) => e.id);

      if (onlyInDir.length > 0 || onlyInDbIds.length > 0) {
        await Promise.all(
          onlyInDir.map(async (fileName) => {
            const filePath = path.join(this.basePath, fileName);
            await fs.promises.unlink(filePath);
          }),
        );
        await this.repository.update(
          { id: In(onlyInDbIds) },
          {
            deletedAt: new Date(),
            unlinkAt: new Date(),
          },
        );
        this.logger.info(
          { type, data: { onlyInDir, onlyInDbIds } },
          `Deleted ${onlyInDir.length} files, Updated ${onlyInDbIds.length} entities`,
        );
      }
    } catch (e: unknown) {
      const error = e as Error;
      this.logger.error({ type, stack: getErrorStack(error) }, error.message || `Failed to process missing files.`);
    }
  }

  @Cron(cronConfig.unlinkedFilesRule!, { disabled: !cronConfig.unlinkedFilesEnabled })
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
    }
  }
}
