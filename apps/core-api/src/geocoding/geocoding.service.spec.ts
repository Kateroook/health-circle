import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { HdxHromadaEntity } from '../alerts/entities/hdx-hromada.entity';
import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  let service: GeocodingService;
  let queryMock: jest.Mock;

  beforeEach(async () => {
    queryMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodingService,
        {
          provide: getRepositoryToken(HdxHromadaEntity),
          useValue: {
            query: queryMock,
          },
        },
      ],
    }).compile();

    service = module.get<GeocodingService>(GeocodingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null if not found in db', async () => {
    queryMock.mockResolvedValue([]);
    const result = await service.reverseGeocode(0, 0);
    expect(result).toBeNull();
  });

  it('should return geocoding result from db', async () => {
    queryMock.mockResolvedValue([
      {
        region: 'Київська',
        district: 'Бориспільський',
        city: 'Бориспільська',
        pcode: 'UA3208001001',
      },
    ]);

    const result = await service.reverseGeocode(50.35, 30.95);
    expect(result).toEqual({
      region: 'Київська',
      district: 'Бориспільський',
      city: 'Бориспільська',
      pcode: 'UA3208001001',
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
