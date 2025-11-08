import { DataLogChangesEntity } from './data-logs-changes.entity';
import { DataLogEntity } from './data-logs.entity';
import { GroupEntity } from './group.entity';
import { UserActivityEntity } from './user-activities.entity';
import { UserActivityTypeEntity } from './user-activity-type.entity';
import { UserPasswordEntity } from './user-password.entity';
import { UserSessionEntity } from './user-sessions.entity';
import { UserEntity } from './user.entity';

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
];
