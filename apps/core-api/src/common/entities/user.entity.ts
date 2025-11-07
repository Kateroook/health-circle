import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { GroupEntity } from './group.entity';
import { UserSessionEntity } from './user_sessions.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_date: Date;

  @Column({ type: 'int', default: 0 })
  failed_login_attempts: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  locked_at: Date;

  @Column({ type: 'varchar' })
  password_hash: string;

  @OneToMany(() => UserSessionEntity, (session) => session.user)
  sessions: UserSessionEntity[];

  @OneToMany(() => GroupEntity, (group) => group.owner)
  owned_groups: GroupEntity[];
}
