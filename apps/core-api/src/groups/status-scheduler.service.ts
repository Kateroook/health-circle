import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from 'src/common/entities/group.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { UserStatus } from 'src/common/enums/user-status';
import { NotificationsService } from 'src/notifications/notifications.service';
import { In, LessThan, Repository } from 'typeorm';

@Injectable()
export class StatusSchedulerService {
  private readonly logger = new Logger(StatusSchedulerService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStatusTransitions() {
    this.logger.debug('Running status transitions check...');
    await this.handleRollCallTimeouts();
    await this.handleStatusExpiry();
  }

  private async handleRollCallTimeouts() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find groups that had a roll call in the last hour or so, but we care about those > 1h ago
    // Actually, we want groups where lastRollCallAt < oneHourAgo
    const groupsWithRecentRollCall = await this.groupRepository.find({
      where: {
        lastRollCallAt: LessThan(oneHourAgo),
      },
      relations: ['members'],
    });

    for (const group of groupsWithRecentRollCall) {
      const usersToUpdate = group.members.filter(
        (user) =>
          (user.status === UserStatus.SAFE || user.status === UserStatus.WAS_SAFE) &&
          group.lastRollCallAt &&
          user.lastStatusUpdate < group.lastRollCallAt,
      );

      if (usersToUpdate.length > 0) {
        this.logger.log(`Timed out ${usersToUpdate.length} users in group ${group.name} due to roll call`);
        const userIds = usersToUpdate.map((u) => u.id);
        await this.userRepository.update({ id: In(userIds) }, { status: UserStatus.UNKNOWN, lastStatusUpdate: new Date() });

        // Notify them? Requirement doesn't explicitly say so, but usually helpful.
        // For now, just logging.
      }
    }
  }

  private async handleStatusExpiry() {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

    const expiredUsers = await this.userRepository.find({
      where: {
        status: UserStatus.SAFE,
        lastStatusUpdate: LessThan(eightHoursAgo),
      },
    });

    if (expiredUsers.length > 0) {
      this.logger.log(`Expiring status for ${expiredUsers.length} users (SAFE -> WAS_SAFE)`);
      const userIds = expiredUsers.map((u) => u.id);
      await this.userRepository.update({ id: In(userIds) }, { status: UserStatus.WAS_SAFE, lastStatusUpdate: new Date() });
    }
  }
}
