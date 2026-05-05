import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';
import { UserStatus } from 'src/common/enums/user-status';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, LessThanOrEqual, Repository } from 'typeorm';

import { GroupEntity } from './entities/group.entity';

@Injectable()
export class StatusQueueService implements OnModuleInit {
  private readonly logger = new Logger(StatusQueueService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    const refreshRate = this.configService.get<string>('CRON_STATUS_REFRESH_RATE', '*/10 * * * * *');
    this.logger.log(`StatusQueueService initialized. Dynamic cron set to: ${refreshRate}`);

    // Ensure we run at least once on startup
    void this.handleStatusTransitions();

    // Schedule dynamic cron job
    const job = new CronJob(refreshRate, () => {
      void this.handleStatusTransitions();
    });

    this.schedulerRegistry.addCronJob('handle-status-transitions', job);
    job.start();
  }

  async handleStatusTransitions() {
    this.logger.debug('Running background status transitions check');
    await Promise.allSettled([this.handleRollCallTimeouts(), this.handleStatusExpiry()]);
  }

  private async handleRollCallTimeouts() {
    const timeoutSeconds = this.configService.get<number>('ROLL_CALL_TIMEOUT_SECONDS', 60 * 60);
    const timeoutThreshold = new Date(Date.now() - timeoutSeconds * 1000);

    const groupsWithRecentRollCall = await this.groupRepository.find({
      where: {
        lastRollCallAt: LessThanOrEqual(timeoutThreshold),
      },
      relations: ['members'],
    });

    const groupChunkSize = 10;
    for (let i = 0; i < groupsWithRecentRollCall.length; i += groupChunkSize) {
      const chunk = groupsWithRecentRollCall.slice(i, i + groupChunkSize);

      const memberIds = [...new Set(chunk.flatMap((group) => group.members.map((m) => m.userId)))];
      if (memberIds.length === 0) continue;

      const members = await this.usersService.findByIds(memberIds);
      const membersById = new Map(members.map((user) => [user.id, user]));

      await Promise.allSettled(
        chunk.map(async (group) => {
          try {
            const groupMemberIds = group.members.map((m) => m.userId);
            if (groupMemberIds.length === 0) return;

            const groupMembers = groupMemberIds
              .map((id) => membersById.get(id))
              .filter((user): user is UserEntity => Boolean(user));

            const usersToUpdate = groupMembers.filter(
              (user) =>
                (user.status === UserStatus.SAFE || user.status === UserStatus.WAS_SAFE) &&
                group.lastRollCallAt &&
                user.lastStatusUpdate <= group.lastRollCallAt,
            );

            if (usersToUpdate.length > 0) {
              this.logger.log(`Timed out ${usersToUpdate.length} users in group ${group.name} due to roll call`);
              await Promise.all(
                usersToUpdate.map((user) =>
                  this.usersService.updateStatus(user.id, UserStatus.UNKNOWN, { memberUserIds: groupMemberIds }),
                ),
              );
            }
          } catch (error: unknown) {
            this.logger.error(`Failed processing roll call timeout for groupId=${group.id}: ${String(error)}`);
          }
        }),
      );
    }

    // Handle personal roll calls from individual users
    const personalTimedOutUsers = await this.userRepository.find({
      where: {
        status: In([UserStatus.SAFE, UserStatus.WAS_SAFE]),
        lastPersonalRollCallAt: LessThanOrEqual(timeoutThreshold),
      },
    });

    const personalUsersToNotify = personalTimedOutUsers.filter(
      (u) => u.lastPersonalRollCallAt && u.lastStatusUpdate <= u.lastPersonalRollCallAt,
    );

    if (personalUsersToNotify.length > 0) {
      this.logger.log(`Timed out ${personalUsersToNotify.length} users due to personal roll call`);
      await Promise.all(personalUsersToNotify.map((u) => this.usersService.updateStatus(u.id, UserStatus.UNKNOWN)));
    }
  }

  private async handleStatusExpiry() {
    const expirySeconds = this.configService.get<number>('STATUS_EXPIRY_SECONDS', 8 * 60 * 60);
    const expiryThreshold = new Date(Date.now() - expirySeconds * 1000);

    const expiredUsers = await this.userRepository.find({
      where: {
        status: UserStatus.SAFE,
        lastStatusUpdate: LessThanOrEqual(expiryThreshold),
      },
    });

    if (expiredUsers.length > 0) {
      this.logger.log(`Expiring status for ${expiredUsers.length} users (SAFE -> WAS_SAFE)`);
      await Promise.all(
        expiredUsers.map((u) => this.usersService.updateStatus(u.id, UserStatus.WAS_SAFE, { memberUserIds: [] })), //no need to send push notifications for this transition
      );
    }
  }
}
