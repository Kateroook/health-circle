import { UserStatus } from '../../../../core-api/src/common/enums/user-status';

export const STATUSES = {
  SAFE: { name: UserStatus.SAFE, label: 'В безпеці' },
  DANGER: { name: UserStatus.DANGER, label: 'Потрібна допомога!' },
  UNKNOWN: { name: UserStatus.UNKNOWN, label: 'Невідомо' },
  WAS_SAFE: { name: UserStatus.WAS_SAFE, label: 'Був у безпеці' },
} as const;
