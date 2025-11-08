import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { DataLogChangesEntity } from './data-logs-changes.entity';
import { UserEntity } from './user.entity';

@Entity('data_logs')
export class DataLogEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 64 })
  entityName: string;

  @Column({ type: 'varchar', length: 64 })
  tableName: string;

  @Column({ type: 'integer', nullable: true })
  recordId?: number | null;

  @Column({ type: 'varchar', nullable: true, length: 64 })
  recordCode?: string | null;

  @Column({ type: 'uuid', nullable: true })
  recordUuid?: string | null;

  @Column({ type: 'varchar', length: 64 })
  logType: string;

  @ManyToOne(() => UserEntity, (value) => value.id, { onDelete: 'SET NULL' })
  user: UserEntity;

  @Column({ type: 'timestamptz' })
  date: Date;

  @OneToMany(() => DataLogChangesEntity, (entity) => entity.log, { cascade: true })
  changes: DataLogChangesEntity[];
}
