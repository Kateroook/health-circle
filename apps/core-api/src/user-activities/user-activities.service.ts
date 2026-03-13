import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { LoggingTypes } from 'src/common/enums/logging-types';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { RequestMetadata } from 'src/common/types/request-metadata';
import { UserActivity } from 'src/common/types/user-activity';
import { Repository } from 'typeorm';

import { UserActivityEntity } from './entities/user-activities.entity';

@Injectable()
export class UserActivitiesService {
  constructor(
    @InjectRepository(UserActivityEntity)
    private readonly repository: Repository<UserActivityEntity>,
    @InjectPinoLogger(UserActivitiesService.name)
    private readonly logger: PinoLogger,
  ) {}

  async logActivity(
    actionCode: UserActivityTypes,
    { deviceInfo, ipAddress, userAgent }: RequestMetadata,
    { userId, subUserId }: Omit<UserActivity, 'actionCode'>,
  ) {
    try {
      await this.repository.save({
        action: { code: actionCode },
        user: { id: userId },
        subUser: subUserId ? { id: subUserId } : null,
        deviceInfo,
        ipAddress,
        userAgent,
      });
    } catch (error: unknown) {
      this.logger.error(
        {
          type: LoggingTypes.other,
          error: error as Record<string, unknown>,
          actionCode,
          metadata: { deviceInfo, ipAddress, userAgent },
          user: { userId, subUserId },
        },
        'Failed to log user activity',
      );
    }
  }
}
