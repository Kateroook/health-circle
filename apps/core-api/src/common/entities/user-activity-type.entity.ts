import { Entity } from 'typeorm';

import { UserActivityTypes } from '../enums/user-activity-types';
import { AbstractDictionary } from './common/abstract-dictionary';

@Entity('dict_user_activity_types')
export class UserActivityTypeEntity extends AbstractDictionary<UserActivityTypes> {
  declare code: UserActivityTypes;
  declare label: UserActivityTypes;
}
