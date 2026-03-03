import type { DetectResult } from 'node-device-detector';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity({ name: 'user_sessions' })
export class UserSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @RelationId((session: UserSessionEntity) => session.user)
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @Index()
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 512, nullable: false })
  userAgent: string;

  @Column({ type: 'varchar', length: 64 })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  jti: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ type: 'jsonb' })
  deviceInfo: DetectResult;
}
