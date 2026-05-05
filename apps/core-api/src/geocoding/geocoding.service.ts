import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HdxHromadaEntity } from '../alerts/entities/hdx-hromada.entity';

export interface GeocodingResult {
  region: string | null; // e.g. "Київська область"
  district: string | null; // e.g. "Бориспільський район"
  city: string | null; // e.g. "Бориспіль"
  pcode: string | null; // e.g. "UA6804047"
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(
    @InjectRepository(HdxHromadaEntity)
    private readonly hdxRepository: Repository<HdxHromadaEntity>,
  ) {}

  async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
    try {
      // Local reverse geocoding using PostGIS
      const result = await this.hdxRepository.query(
        `
        SELECT 
          adm1_ua as region,
          adm2_ua as district,
          adm3_ua as city,
          pcode as pcode
        FROM hdx_hromadas
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
        LIMIT 1;
        `,
        [lon, lat],
      );

      if (result && result.length > 0) {
        const row = result[0];
        return {
          region: row.region || null,
          district: row.district || null,
          city: row.city || null,
          pcode: row.pcode || null,
        };
      }

      return null;
    } catch (err) {
      this.logger.error(`Failed to reverse geocode (${lat}, ${lon}): ${err.message}`);
      return null;
    }
  }
}
