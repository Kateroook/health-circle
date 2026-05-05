import { Controller, Get, Logger, ParseFloatPipe, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Public } from '../common/decorators/public.decorator';
import { GeocodingService } from '../geocoding/geocoding.service';
import { AlertRegionResolverService } from './alert-region-resolver.service';
import { HdxHromadaEntity } from './entities/hdx-hromada.entity';

@Controller('geocoding-test')
export class GeocodingTestController {
  private readonly logger = new Logger(GeocodingTestController.name);

  constructor(
    private readonly geocodingService: GeocodingService,
    private readonly alertResolver: AlertRegionResolverService,
    @InjectRepository(HdxHromadaEntity)
    private readonly hdxRepository: Repository<HdxHromadaEntity>,
  ) {}

  @Public() // Assuming you have a Public decorator for non-auth endpoints
  @Get()
  async testGeocoding(@Query('lat', ParseFloatPipe) lat: number, @Query('lng', ParseFloatPipe) lng: number) {
    this.logger.log(`Testing geocoding for coordinates: ${lat}, ${lng}`);

    const start = performance.now();

    // 1. Get raw HDX data using direct SQL for transparency
    const rawHdx = await this.hdxRepository.query(
      `
      SELECT 
        pcode,
        adm1_ua,
        adm2_ua,
        adm3_ua
      FROM hdx_hromadas
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      LIMIT 1;
      `,
      [lng, lat],
    );

    // 2. Get GeocodingService result (the generic one)
    const geocodingResult = await this.geocodingService.reverseGeocode(lat, lng);

    // 3. Get AlertRegionResolverService result (the one linked to alerts_regions)
    const alertUid = await this.alertResolver.resolveByCoordinates(lat, lng);

    const end = performance.now();
    const durationMs = Math.round(end - start);

    return {
      input: { lat, lng },
      duration_ms: durationMs,
      hdx_raw: rawHdx.length > 0 ? rawHdx[0] : null,
      geocoding_service_output: geocodingResult,
      final_alert_uid: alertUid,
      success: !!alertUid,
      timestamp: new Date().toISOString(),
    };
  }
}
