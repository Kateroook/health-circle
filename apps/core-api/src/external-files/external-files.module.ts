import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExternalFilesEntity } from './entities/external-files.entity';
import { ExternalFilesService } from './external-files.service';
import { ExternalFilesQueueService } from './external-files-cron/external-files-queue.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExternalFilesEntity])],
  controllers: [],
  providers: [ExternalFilesService, ExternalFilesQueueService],
  exports: [ExternalFilesService],
})
export class ExternalFilesModule {}
