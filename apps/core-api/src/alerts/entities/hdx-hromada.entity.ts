import { Column, Entity, Index,PrimaryColumn } from 'typeorm';

@Entity({ name: 'hdx_hromadas' })
export class HdxHromadaEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  pcode: string;

  @Column({ type: 'varchar', length: 255 })
  adm3_ua: string;

  @Column({ type: 'varchar', length: 255 })
  adm2_ua: string;

  @Column({ type: 'varchar', length: 255 })
  adm1_ua: string;

  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
  })
  geom: string;
}
