import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatus } from 'src/common/enums/user-status';
import { QueueService } from 'src/common/queue/queue.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, LessThan, Repository } from 'typeorm';

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
    private readonly queueService: QueueService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    await this.queueService.schedule('handle-status-transitions', '*/5 * * * *');
    await this.queueService.work('handle-status-transitions', () => this.handleStatusTransitions());
  }

  async handleStatusTransitions() {
    this.logger.debug('Running status transitions check via queue...');
    await this.handleRollCallTimeouts();
    await this.handleStatusExpiry();
  }

  private async handleRollCallTimeouts() {
    const timeoutSeconds = this.configService.get<number>('ROLL_CALL_TIMEOUT_SECONDS', 60 * 60);
    const timeoutThreshold = new Date(Date.now() - timeoutSeconds * 1000);

    const groupsWithRecentRollCall = await this.groupRepository.find({
      where: {
        lastRollCallAt: LessThan(timeoutThreshold),
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
                user.lastStatusUpdate < group.lastRollCallAt,
            );

            if (usersToUpdate.length > 0) {
              this.logger.log(`Timed out ${usersToUpdate.length} users in group ${group.name} due to roll call`);
              for (const user of usersToUpdate) {
                await this.usersService.updateStatus(user.id, UserStatus.UNKNOWN, { memberUserIds: groupMemberIds });
              }
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
        lastPersonalRollCallAt: LessThan(timeoutThreshold),
      },
    });

    const personalUsersToNotify = personalTimedOutUsers.filter(
      (u) => u.lastPersonalRollCallAt && u.lastStatusUpdate < u.lastPersonalRollCallAt,
    );

    if (personalUsersToNotify.length > 0) {
      this.logger.log(`Timed out ${personalUsersToNotify.length} users due to personal roll call`);
      for (const u of personalUsersToNotify) {
        await this.usersService.updateStatus(u.id, UserStatus.UNKNOWN);
      }
    }
  }

  private async handleStatusExpiry() {
    const expirySeconds = this.configService.get<number>('STATUS_EXPIRY_SECONDS', 8 * 60 * 60);
    const expiryThreshold = new Date(Date.now() - expirySeconds * 1000);

    const expiredUsers = await this.userRepository.find({
      where: {
        status: UserStatus.SAFE,
        lastStatusUpdate: LessThan(expiryThreshold),
      },
    });

    if (expiredUsers.length > 0) {
      this.logger.log(`Expiring status for ${expiredUsers.length} users (SAFE -> WAS_SAFE)`);
      for (const u of expiredUsers) {
        await this.usersService.updateStatus(u.id, UserStatus.WAS_SAFE);
      }
    }
  }
}
