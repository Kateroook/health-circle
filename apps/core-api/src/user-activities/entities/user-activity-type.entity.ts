import { Entity } from 'typeorm';

import { AbstractDictionary } from '../../common/abstracts/abstract-dictionary';
import { UserActivityTypes } from '../../common/enums/user-activity-types';

@Entity('dict_user_activity_types')
export class UserActivityTypeEntity extends AbstractDictionary<UserActivityTypes> {
  declare code: UserActivityTypes;
  declare label: UserActivityTypes;
}
