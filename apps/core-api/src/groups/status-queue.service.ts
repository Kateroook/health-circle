import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatus } from 'src/common/enums/user-status';
import { QueueService } from 'src/common/queue/queue.service';
import { FirestoreSyncService } from 'src/notifications/firestore-sync.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, LessThan, Repository } from 'typeorm';

import { GroupEntity } from './entities/group.entity';
import { GroupMemberEntity } from './entities/group-member.entity';

@Injectable()
export class StatusQueueService implements OnModuleInit {
  private readonly logger = new Logger(StatusQueueService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly memberRepository: Repository<GroupMemberEntity>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly firestoreSyncService: FirestoreSyncService,
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
    const timeoutMinutes = this.configService.get<number>('ROLL_CALL_TIMEOUT_MINUTES', 60);
    const timeoutThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const groupsWithRecentRollCall = await this.groupRepository.find({
      where: {
        lastRollCallAt: LessThan(timeoutThreshold),
      },
      relations: ['members'],
    });

    for (const group of groupsWithRecentRollCall) {
      const memberIds = group.members.map((m) => m.userId);
      if (memberIds.length === 0) continue;

      const members = await this.usersService.findByIds(memberIds);

      const usersToUpdate = members.filter(
        (user) =>
          (user.status === UserStatus.SAFE || user.status === UserStatus.WAS_SAFE) &&
          group.lastRollCallAt &&
          user.lastStatusUpdate < group.lastRollCallAt,
      );

      if (usersToUpdate.length > 0) {
        this.logger.log(`Timed out ${usersToUpdate.length} users in group ${group.name} due to roll call`);
        for (const u of usersToUpdate) {
          await this.usersService.updateStatus(u.id, UserStatus.UNKNOWN, [group.id]);
        }
      }
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
    const expiryHours = this.configService.get<number>('STATUS_EXPIRY_HOURS', 8);
    const expiryThreshold = new Date(Date.now() - expiryHours * 60 * 60 * 1000);

    const expiredUsers = await this.userRepository.find({
      where: {
        status: UserStatus.SAFE,
        lastStatusUpdate: LessThan(expiryThreshold),
      },
    });

    if (expiredUsers.length > 0) {
      this.logger.log(`Expiring status for ${expiredUsers.length} users (SAFE -> WAS_SAFE)`);
      const userIds = expiredUsers.map((u) => u.id);
      await this.userRepository.update({ id: In(userIds) }, { status: UserStatus.WAS_SAFE, lastStatusUpdate: new Date() });
      await this.syncUsers(userIds);
    }
  }

  private async syncUsers(userIds: string[]) {
    await this.firestoreSyncService.sendSyncSignal(userIds);
  }
}
