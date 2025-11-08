import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bunyan } from 'nestjs-bunyan';
import { UserActivityEntity } from 'src/common/entities/user-activities.entity';
import { LoggingTypes } from 'src/common/enums/logging-types';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { RequestMetadata } from 'src/common/types/request-metadata';
import { UserActivity } from 'src/common/types/user-activity';
import { Repository } from 'typeorm';

@Injectable()
export class UserActivitiesService {
  constructor(
    @InjectRepository(UserActivityEntity)
    private readonly repository: Repository<UserActivityEntity>,
    private readonly logger: Bunyan,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      this.logger.error(
        {
          type: LoggingTypes.other,
          error,
          actionCode,
          metadata: { deviceInfo, ipAddress, userAgent },
          user: { userId, subUserId },
        },
        'Failed to log user activity',
      );
    }
  }
}
