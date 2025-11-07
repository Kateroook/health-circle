import { UserActivityTypes } from '../enums/user-activity-types';

export type UserActivity = {
  actionCode: UserActivityTypes;
  userId: string;
  subUserId?: string;
};
