import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity({ name: 'user_sessions' })
export class UserSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.sessions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar' })
  jti: string;

  @Column({ type: 'varchar' })
  token_hash: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_used_at: Date;

  @Column({ type: 'varchar', nullable: true })
  device_info: string;

  @Column({ type: 'varchar', nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', nullable: true })
  user_agent: string;
}
