import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity({ name: 'user_notification_settings' })
export class UserNotificationSettingsEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @OneToOne(() => UserEntity, (user) => user.notificationSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'jsonb', default: {} })
  prefs: Record<string, boolean>;

  static DEFAULT_PREFS: Record<string, boolean> = {
    airAlerts: true,
    statusUpdates: true,
    unknownStatusAlerts: true,
    statusUpdateReminders: true,
    moodReminders: true,
    smsFallover: false,
    smsSafetyStatus: false,
  };
}
