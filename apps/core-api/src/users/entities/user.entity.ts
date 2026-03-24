import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserStatus } from '../../common/enums/user-status';
import { ExternalFilesEntity } from '../../external-files/entities/external-files.entity';
import { UserNotificationSettingsEntity } from './user-notification-settings.entity';
import { UserSessionEntity } from './user-sessions.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middleName: string | null;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Index({ unique: true, where: 'email IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Index({ unique: true, where: 'phone IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  lastLoginDate: Date;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.UNKNOWN })
  status: UserStatus;

  @Column({ type: 'varchar', nullable: true, select: false })
  fcmToken: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMPTZ' })
  lastStatusUpdate: Date;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'varchar', nullable: true })
  region: string | null;

  @Column({ type: 'varchar', nullable: true })
  district: string | null;

  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastPersonalRollCallAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', select: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', select: false })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lockedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  avatarUpdatedAt: Date;

  @OneToOne(() => ExternalFilesEntity, { nullable: true, cascade: true })
  @JoinColumn()
  file?: ExternalFilesEntity; // avatar

  @OneToMany(() => UserSessionEntity, (session) => session.user)
  sessions: UserSessionEntity[];

  @OneToOne(() => UserNotificationSettingsEntity, (settings) => settings.user, { cascade: true })
  notificationSettings: UserNotificationSettingsEntity;

  @Column({ type: 'boolean', default: false })
  isRegistered: boolean;

  isAlias?: boolean;
}
