import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AlertsRegionEntity } from './entities/alerts-region.entity';

@Injectable()
export class AlertRegionResolverService {
  private readonly logger = new Logger(AlertRegionResolverService.name);

  constructor(
    @InjectRepository(AlertsRegionEntity)
    private readonly alertsRegionRepository: Repository<AlertsRegionEntity>,
  ) {}

  /**
   * Resolves coordinates to the corresponding Alerts.in.ua UID using local PostGIS data.
   */
  async resolveByCoordinates(lat: number, lon: number): Promise<number | null> {
    try {
      // Execute the optimized spatial query.
      // ST_MakePoint takes (longitude, latitude).
      // We join the alerts_regions metadata based on the hdx_pcode mapped during fuzzy matching.
      // We use LEFT JOIN so we still get the Hromada record (and its Oblast) even if fuzzy matching missed it.
      const result = await this.alertsRegionRepository.query(
        `
        SELECT 
          ar.uid as alert_uid, 
          ar.name as alert_name, 
          h.adm3_ua as hromada_name,
          h.adm1_ua as oblast_name
        FROM hdx_hromadas h
        LEFT JOIN alerts_regions ar ON ar.hdx_pcode = h.pcode
        WHERE ST_Contains(
          h.geom, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)
        )
        LIMIT 1;
      `,
        [lon, lat],
      );

      if (result && result.length > 0) {
        const row = result[0];

        // 1. If we found a direct mapping to the Hromada
        if (row.alert_uid) {
          this.logger.log(`Resolved (${lat}, ${lon}) to Hromada UID: ${row.alert_uid} (${row.alert_name})`);
          return row.alert_uid;
        }

        // 2. Fallback to Oblast if Hromada was found in HDX but not mapped in alerts_regions
        if (row.oblast_name) {
          this.logger.log(`Hromada unmapped. Falling back to Oblast: ${row.oblast_name}`);
          return this.resolveFallbackOblast(row.oblast_name);
        }
      }

      this.logger.warn(`No Hromada found for coordinates (${lat}, ${lon}). Outside of Ukraine or unmapped area.`);
      return null;
    } catch (err) {
      this.logger.error(`Error executing PostGIS query for (${lat}, ${lon}): ${err.message}`);
      return null;
    }
  }

  private async resolveFallbackOblast(oblastName: string): Promise<number | null> {
    // Basic normalization of the HDX Oblast name to match Alerts.in.ua naming
    // HDX: "Kyivska" or "Київська", Alerts: "Київська"
    const normalized = oblastName.replace(/( область| Oblast| City| м\.|'s)/gi, '').trim();

    const oblasts = await this.alertsRegionRepository
      .createQueryBuilder('ar')
      .where('ar.name ILIKE :name', { name: `%${normalized}%` })
      .andWhere('ar.type IN (:...types)', { types: ['Область', 'Місто з спеціальним статусом'] })
      .getMany();

    if (oblasts.length === 0) return null;

    // Prefer exact match
    const exactMatch = oblasts.find((o) => o.name.toLowerCase() === oblastName.toLowerCase());
    return exactMatch ? exactMatch.uid : oblasts[0].uid;
  }

  // Fallback string-based resolution method (kept for legacy reasons or manual search)
  async resolve(region?: string, district?: string): Promise<number | null> {
    if (!region && !district) return null;

    const search = district || region;
    if (!search) return null;

    // A very basic string search for legacy backwards compatibility
    const normalized = search
      .replace(/( область| Oblast| City| м\.| район| Raion| District| територіальна громада| громада| Community| Town)/gi, '')
      .trim();

    const match = await this.alertsRegionRepository
      .createQueryBuilder('ar')
      .where('ar.name ILIKE :name', { name: `%${normalized}%` })
      .getOne();

    return match ? match.uid : null;
  }
}
