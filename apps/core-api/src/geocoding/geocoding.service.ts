import { Injectable, Logger } from '@nestjs/common';

export interface GeocodingResult {
  region: string | null; // e.g. "Київська область"
  district: string | null; // e.g. "Бориспільський район"
  city: string | null; // e.g. "Бориспіль"
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly photonUrl = 'https://photon.komoot.io/reverse';

  async reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
    try {
      const url = `${this.photonUrl}?lat=${lat}&lon=${lon}&lang=uk`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Photon API returned ${response.status}`);
      }

      const data = (await response.json());
      const features = data.features || [];

      if (features.length === 0) {
        return null;
      }

      const props = features[0].properties;

      // Photon returns:
      // state: usually Oblast name
      // county: usually Raion name
      // city/town/village: City name

      return {
        region: props.state || null,
        district: props.county || props.district || null,
        city: props.city || props.town || props.village || null,
      };
    } catch (err) {
      this.logger.error(`Failed to reverse geocode (${lat}, ${lon}): ${err.message}`);
      return null;
    }
  }
}
