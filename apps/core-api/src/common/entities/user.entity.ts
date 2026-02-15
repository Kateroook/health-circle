import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserStatus } from '../enums/user-status';
import { ContactEntity } from './contact.entity';
import { ExternalFilesEntity } from './external-files.entity';
import { GroupEntity } from './group.entity';
import { UserSessionEntity } from './user-sessions.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  middleName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Index({ unique: true, where: '"email" IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Index({ unique: true, where: '"phone" IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginDate: Date;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.UNKNOWN })
  status: UserStatus;

  @Column({ type: 'varchar', nullable: true })
  fcmToken: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMPTZ' })
  lastStatusUpdate: Date;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
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

  @OneToMany(() => GroupEntity, (group) => group.owner, { cascade: ['remove'], orphanedRowAction: 'delete' })
  ownedGroups: GroupEntity[];

  @ManyToMany(() => GroupEntity, (group) => group.members, { onDelete: 'CASCADE' })
  groups: GroupEntity[];

  @OneToMany(() => ContactEntity, (contact) => contact.owner)
  contacts: ContactEntity[];
}
