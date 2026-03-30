import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AlertsRegionEntity } from './entities/alerts-region.entity';

@Injectable()
export class AlertRegionResolverService {
  private readonly OBLAST_MAP: Record<string, string> = {
    // English
    Cherkasy: 'Черкаська',
    Chernihiv: 'Чернігівська',
    Chernivtsi: 'Чернівецька',
    Dnipropetrovsk: 'Дніпропетровська',
    Donetsk: 'Донецька',
    'Ivano-Frankivsk': 'Івано-Франківська',
    Kharkiv: 'Харківська',
    Kherson: 'Херсонська',
    Khmelnytskyi: 'Хмельницька',
    Kirovohrad: 'Кіровоградська',
    Kyiv: 'Київська',
    Luhansk: 'Луганська',
    Lviv: 'Львівська',
    Mykolaiv: 'Миколаївська',
    Odesa: 'Одеська',
    Poltava: 'Полтавська',
    Rivne: 'Рівненська',
    Sumy: 'Сумська',
    Ternopil: 'Тернопільська',
    Vinnytsia: 'Вінницька',
    Volyn: 'Волинська',
    Zakarpattia: 'Закарпатська',
    Zaporizhzhia: 'Запорізька',
    Zhytomyr: 'Житомирська',
    Crimea: 'Крим',
    // Russian
    Черкасская: 'Черкаська',
    Черниговская: 'Чернігівська',
    Черновицкая: 'Чернівецька',
    Днепропетровская: 'Дніпропетровська',
    Донецкая: 'Донецька',
    'Ивано-Франковская': 'Івано-Франківська',
    Харьковская: 'Харківська',
    Херсонская: 'Херсонська',
    Хмельницкая: 'Хмельницька',
    Кировоградская: 'Кіровоградська',
    Киевская: 'Київська',
    Луганская: 'Луганська',
    Львовская: 'Львівська',
    Николаевская: 'Миколаївська',
    Одесская: 'Одеська',
    Полтавская: 'Полтавська',
    Ровенская: 'Рівненська',
    Сумская: 'Сумська',
    Тернопольская: 'Тернопільська',
    Винницкая: 'Вінницька',
    Волынская: 'Волинська',
    Закарпатская: 'Закарпатська',
    Запорожская: 'Запорізька',
    Житомирская: 'Житомирська',
    Крым: 'Крим',
    Киев: 'Київ',
    Севастополь: 'Севастополь',
  };

  constructor(
    @InjectRepository(AlertsRegionEntity)
    private readonly alertsRegionRepository: Repository<AlertsRegionEntity>,
  ) {}

  async resolve(region?: string, district?: string): Promise<number | null> {
    const normalizedRegion = this.normalizeRegionName(region);
    if (!normalizedRegion) return null;

    const oblast = await this.findOblast(normalizedRegion);
    if (!oblast) return null;
    if (!district) return oblast.uid;

    const normalizedDistrict = this.normalizeDistrictName(district);
    if (!normalizedDistrict) return oblast.uid;

    const raion = await this.findRaion(oblast.uid, normalizedDistrict);
    if (raion) return raion.uid;

    const hromada = await this.findHromada(normalizedDistrict, oblast.uid);
    return hromada ? hromada.uid : oblast.uid;
  }

  private normalizeRegionName(region?: string): string | null {
    if (!region) return null;
    let normalized = region.replace(/( область| Oblast| City| м\.|'s)/gi, '').trim();
    for (const [en, ua] of Object.entries(this.OBLAST_MAP)) {
      if (normalized.toLowerCase().includes(en.toLowerCase())) {
        normalized = ua;
        break;
      }
    }
    return normalized || null;
  }

  private normalizeDistrictName(district?: string): string | null {
    if (!district) return null;
    return district.replace(/( район| Raion| District| територіальна громада| громада| Community| Town| City| м\.)/gi, '').trim();
  }

  private async findOblast(name: string): Promise<AlertsRegionEntity | null> {
    const oblasts = await this.alertsRegionRepository
      .createQueryBuilder('ar')
      .where('ar.name ILIKE :name', { name: `%${name}%` })
      .andWhere('ar.type IN (:...types)', { types: ['Область', 'Місто з спеціальним статусом'] })
      .getMany();
    return oblasts[0] ?? null;
  }

  private async findRaion(oblastUid: number, name: string): Promise<AlertsRegionEntity | null> {
    const raions = await this.alertsRegionRepository
      .createQueryBuilder('ar')
      .where('ar.parentUid = :parentUid', { parentUid: oblastUid })
      .andWhere('ar.name ILIKE :name', { name: `%${name}%` })
      .andWhere('ar.type = :type', { type: 'Район' })
      .getMany();
    return raions[0] ?? null;
  }

  private async findHromada(name: string, oblastUid: number): Promise<AlertsRegionEntity | null> {
    const hromada = await this.alertsRegionRepository
      .createQueryBuilder('ar')
      .where('ar.name ILIKE :name', { name: `%${name}%` })
      .andWhere('ar.type = :type', { type: 'Громада' })
      .andWhere('ar.parentUid = :parentUid', { parentUid: oblastUid })
      .getOne();
    if (hromada) return hromada;

    const directHromada = await this.alertsRegionRepository
      .createQueryBuilder('ar')
      .where('ar.parentUid = :parentUid', { parentUid: oblastUid })
      .andWhere('ar.name ILIKE :name', { name: `%${name}%` })
      .andWhere('ar.type = :type', { type: 'Громада' })
      .getOne();
    return directHromada ?? null;
  }
}
