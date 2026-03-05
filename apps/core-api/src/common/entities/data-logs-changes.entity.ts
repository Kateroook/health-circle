import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { DataLogEntity } from './data-logs.entity';

@Entity('data_logs_changes')
export class DataLogChangesEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  propertyName: string;

  @Column({ type: 'varchar', length: 65535, nullable: true })
  oldValue: string;

  @Column({ type: 'varchar', length: 65535, nullable: true })
  newValue: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  valueType: string;

  @ManyToOne(() => DataLogEntity, (entity) => entity.id, { nullable: false, onDelete: 'CASCADE' })
  log: DataLogEntity;
}
