import type { DetectResult } from 'node-device-detector';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { UserActivityTypeEntity } from './user-activity-type.entity';

@Entity('user_activities')
export class UserActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserActivityTypeEntity, (entity) => entity.code, { nullable: false })
  action: UserActivityTypeEntity;

  @RelationId((activity: UserActivityEntity) => activity.user)
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @Index()
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'device_info', type: 'json', nullable: true })
  deviceInfo: DetectResult;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
