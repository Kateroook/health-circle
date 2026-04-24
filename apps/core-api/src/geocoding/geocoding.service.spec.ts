import { Test, TestingModule } from '@nestjs/testing';

import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  let service: GeocodingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeocodingService],
    }).compile();

    service = module.get<GeocodingService>(GeocodingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should parse Photon response correctly', async () => {
    const mockResponse = {
      features: [
        {
          properties: {
            state: 'Київська область',
            county: 'Бориспільський район',
            city: 'Бориспіль',
          },
        },
      ],
    };

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await service.reverseGeocode(50.35, 30.95);
    expect(result).toEqual({
      region: 'Київська область',
      district: 'Бориспільський район',
      city: 'Бориспіль',
    });
  });

  it('should return null if no features found', async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ features: [] }),
      }),
    );

    const result = await service.reverseGeocode(0, 0);
    expect(result).toBeNull();
  });
});
