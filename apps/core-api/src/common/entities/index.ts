import { AlertsRegionEntity } from 'src/alerts/entities/alerts-region.entity';
import { UserNotificationSettingsEntity } from 'src/users/entities/user-notification-settings.entity';

import { ConfirmationCodeEntity } from '../../confirmations/entities/confirmation-code.entity';
import { ContactEntity } from '../../contacts/entities/contact.entity';
import { ExternalFilesEntity } from '../../external-files/entities/external-files.entity';
import { GroupEntity } from '../../groups/entities/group.entity';
import { GroupBlockListEntity } from '../../groups/entities/group-block-list.entity';
import { GroupMemberEntity } from '../../groups/entities/group-member.entity';
import { DataLogEntity } from '../../logging/entities/data-logs.entity';
import { DataLogChangesEntity } from '../../logging/entities/data-logs-changes.entity';
import { SystemLogEntity } from '../../logging/entities/system-logs.entity';
import { UserActivityEntity } from '../../user-activities/entities/user-activities.entity';
import { UserActivityTypeEntity } from '../../user-activities/entities/user-activity-type.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { UserPasswordEntity } from '../../users/entities/user-password.entity';
import { UserSessionEntity } from '../../users/entities/user-sessions.entity';

export const entities = [
  UserEntity,
  UserSessionEntity,
  UserPasswordEntity,
  GroupEntity,
  GroupMemberEntity,
  UserActivityEntity,
  UserActivityTypeEntity,
  DataLogEntity,
  DataLogChangesEntity,
  ExternalFilesEntity,
  ConfirmationCodeEntity,
  ContactEntity,
  GroupBlockListEntity,
  SystemLogEntity,
  UserNotificationSettingsEntity,
  AlertsRegionEntity,
];
