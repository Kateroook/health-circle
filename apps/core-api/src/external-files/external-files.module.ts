import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalFilesEntity } from 'src/common/entities/external-files.entity';
import { ExternalFilesCronService } from './external-files-cron/external-files-cron.service';
import { ExternalFilesService } from './external-files.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExternalFilesEntity])],
  controllers: [],
  providers: [ExternalFilesService, ExternalFilesCronService],
  exports: [ExternalFilesService],
})
export class ExternalFilesModule {}
