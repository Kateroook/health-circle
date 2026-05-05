import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HdxHromadaEntity } from '../alerts/entities/hdx-hromada.entity';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [TypeOrmModule.forFeature([HdxHromadaEntity])],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}
