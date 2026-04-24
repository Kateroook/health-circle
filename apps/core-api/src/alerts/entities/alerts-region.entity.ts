import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'alerts_regions' })
export class AlertsRegionEntity {
  @PrimaryColumn({ type: 'int' })
  uid: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // oblast, raion, hromada, city, unknown
}
