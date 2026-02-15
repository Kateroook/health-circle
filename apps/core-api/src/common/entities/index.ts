import { ConfirmationCodeEntity } from './confirmation-code.entity';
import { ContactEntity } from './contact.entity';
import { DataLogEntity } from './data-logs.entity';
import { DataLogChangesEntity } from './data-logs-changes.entity';
import { ExternalFilesEntity } from './external-files.entity';
import { GroupEntity } from './group.entity';
import { UserEntity } from './user.entity';
import { UserActivityEntity } from './user-activities.entity';
import { UserActivityTypeEntity } from './user-activity-type.entity';
import { UserPasswordEntity } from './user-password.entity';
import { UserSessionEntity } from './user-sessions.entity';

export const entities = [
  UserEntity,
  UserSessionEntity,
  UserPasswordEntity,
  UserSessionEntity,
  GroupEntity,
  UserActivityEntity,
  UserActivityTypeEntity,
  DataLogEntity,
  DataLogChangesEntity,
  ExternalFilesEntity,
  ConfirmationCodeEntity,
  ContactEntity,
];
