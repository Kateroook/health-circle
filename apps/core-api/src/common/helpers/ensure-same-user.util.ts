import { ForbiddenException } from '@nestjs/common';

export function ensureSameUser(targetId: string, currentUserId: string) {
  if (targetId !== currentUserId) {
    throw new ForbiddenException('Ви не можете виконати цю операцію');
  }
}
