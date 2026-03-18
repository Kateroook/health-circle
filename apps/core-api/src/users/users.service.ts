import { BadRequestException, Injectable, Logger, NotFoundException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { UserStatus } from 'src/common/enums/user-status';
import { ensureSameUser } from 'src/common/helpers/ensure-same-user.util';
import { RequestMetadata } from 'src/common/types/request-metadata';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { ConfirmationTypes } from 'src/confirmations/enums/confirmation-type';
import { ExternalFilesService } from 'src/external-files/external-files.service';
import { FirestoreSyncService } from 'src/notifications/firestore-sync.service';
import { NotificationTemplates, NotificationType } from 'src/notifications/notification-types';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { EntityManager, In, QueryRunner, Repository } from 'typeorm';

import { GroupMemberEntity } from '../groups/entities/group-member.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserNotificationSettingsEntity } from './entities/user-notification-settings.entity';
import { UserPasswordEntity } from './entities/user-password.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(UserEntity)
    protected readonly repository: Repository<UserEntity>,
    @InjectRepository(UserPasswordEntity)
    protected readonly passwordRepository: Repository<UserPasswordEntity>,
    protected readonly confirmationsService: ConfirmationsService,
    protected readonly userActivitiesService: UserActivitiesService,
    protected readonly configService: ConfigService,
    protected readonly externalFilesService: ExternalFilesService,
    @InjectRepository(GroupMemberEntity)
    protected readonly memberRepository: Repository<GroupMemberEntity>,
    @InjectRepository(UserNotificationSettingsEntity)
    protected readonly notificationSettingsRepository: Repository<UserNotificationSettingsEntity>,
    private notificationsService: NotificationsService,
    private firestoreSyncService: FirestoreSyncService,
  ) {}

  async getNotificationSettingsInternal(userId: string): Promise<UserNotificationSettingsEntity> {
    let settings = await this.notificationSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = this.notificationSettingsRepository.create({
        userId,
        prefs: UserNotificationSettingsEntity.DEFAULT_PREFS,
      });
      await this.notificationSettingsRepository.save(settings as any);
    }
    settings.prefs = { ...UserNotificationSettingsEntity.DEFAULT_PREFS, ...settings.prefs };
    return settings;
  }

  async getNotificationSettings(userId: string): Promise<UserNotificationSettingsEntity> {
    const settings = await this.getNotificationSettingsInternal(userId);
    return { ...settings, ...settings.prefs } as any;
  }

  async updateNotificationSettings(userId: string, dto: any): Promise<UserNotificationSettingsEntity> {
    const settings = await this.getNotificationSettingsInternal(userId);
    const { enabled, ...prefs } = dto;

    if (enabled !== undefined) {
      settings.enabled = enabled;
    }

    settings.prefs = { ...settings.prefs, ...prefs };
    const saved = await this.notificationSettingsRepository.save(settings as any);
    return { ...saved, ...saved.prefs };
  }

  async getTokensForUsers(userIds: string[], settingKey?: string): Promise<string[]> {
    const users = await this.repository.find({
      where: { id: In(userIds) },
      select: ['id', 'fcmToken'],
      relations: ['notificationSettings'],
    });

    return users
      .filter((u) => {
        if (!u.fcmToken) return false;
        const settings = u.notificationSettings;
        if (!settings) return true;
        if (!settings.enabled) return false;
        if (settingKey && settings.prefs && settings.prefs[settingKey] === false) {
          return false;
        }
        return true;
      })
      .map((u) => u.fcmToken as string);
  }

  async updateStatus(userId: string, status: UserStatus, groupMemberIds?: string[]) {
    const user = await this.repository.findOne({
      where: { id: userId },
    });
    if (!user) return;

    user.status = status;
    user.lastStatusUpdate = new Date();
    await this.repository.save(user);

    // If groupMemberIds are not provided, find all members from all groups the user belongs to
    let targetMemberIds = groupMemberIds;
    if (!targetMemberIds || targetMemberIds.length === 0) {
      const memberships = await this.memberRepository.find({
        where: { userId },
        select: ['groupId'],
      });
      const groupIds = memberships.map((m) => m.groupId);

      if (groupIds.length > 0) {
        const allMemberships = await this.memberRepository.find({
          where: { groupId: In(groupIds) },
          select: ['userId'],
        });
        targetMemberIds = Array.from(new Set(allMemberships.map((m) => m.userId)));
      }
    }

    if (targetMemberIds && targetMemberIds.length > 0) {
      const isUnknown = status === UserStatus.UNKNOWN;
      const type = isUnknown ? NotificationType.UNKNOWN_STATUS : NotificationType.STATUS_UPDATE;
      const template = NotificationTemplates[type];
      const tokens = await this.getTokensForUsers(targetMemberIds, template.permissionKey);

      const devSendToSelf = this.configService.get<boolean>('DEV_SEND_PUSH_TO_SENDER', false);
      if (devSendToSelf && !tokens.includes(user.fcmToken as string) && user.fcmToken) {
        this.logger.log(`Dev Mode: Including sender ${userId} in notifications`);
        tokens.push(user.fcmToken);
      }

      if (tokens.length > 0) {
        let statusName = 'невідомий';
        if (status === UserStatus.SAFE) statusName = 'у безпеці';
        else if (status === UserStatus.DANGER) statusName = 'у небезпеці';
        else if (status === UserStatus.WAS_SAFE) statusName = 'був у безпеці';

        await this.notificationsService.sendMulticastByType(
          tokens,
          type,
          {
            firstName: user.firstName,
            lastName: user.lastName,
            statusName,
          },
          {
            userId,
            status,
          },
        );
      }

      await this.firestoreSyncService.sendSyncSignal(Array.from(new Set([...targetMemberIds, userId])));
    } else {
      await this.firestoreSyncService.sendSyncSignal([userId]);
    }

    return { status: user.status, message: 'Status updated' };
  }

  async saveFcmToken(userId: string, token: string) {
    await this.repository.update({ id: userId }, { fcmToken: token });
    return { message: 'Token updated' };
  }

  async upsertFile(userId: string, file: Express.Multer.File, queryRunner?: QueryRunner): Promise<UserEntity> {
    const manager = queryRunner?.manager || this.repository.manager;
    return manager.transaction(async (trx) => {
      const user = await trx.findOne(UserEntity, { where: { id: userId }, relations: ['file'] });
      if (!user) throw new NotFoundException('Користувача не знайдено');
      user.file = await this.externalFilesService.replaceFile(
        user.file?.id || null,
        {
          originalname: file.originalname,
          buffer: file.buffer,
          mimetype: file.mimetype,
        },
        trx.queryRunner,
      );
      user.avatarUpdatedAt = new Date();
      return trx.save(user);
    });
  }

  async getFile(userId: string): Promise<StreamableFile> {
    const user = await this.repository.findOne({ where: { id: userId }, relations: ['file'] });
    if (!user || !user.file) throw new NotFoundException('Користувача або файл не знайдено');
    return this.externalFilesService.getStreamableFile(user.file);
  }

  async removeFile(userId: string, manager?: EntityManager): Promise<void> {
    const entityManager = manager || this.repository.manager;
    const user = await entityManager.findOne(UserEntity, {
      where: { id: userId },
      relations: ['file'],
    });
    if (!user) throw new NotFoundException(`Користувача не знайдено`);
    if (!user.file?.id) throw new NotFoundException(`Нема файлу для видалення`);
    await this.externalFilesService.delete(user.file.id, entityManager.queryRunner);
    user.file = undefined;
    user.avatarUpdatedAt = new Date();
    await entityManager.save(UserEntity, user);
  }

  public async getOne(id: string, user: UserProfileDto): Promise<UserEntity> {
    ensureSameUser(id, user.id);
    const targetUser = await this.repository.findOneBy({ id });
    if (!targetUser) throw new NotFoundException(`Користувача з id = ${id} не знайдено`);
    return targetUser;
  }

  public async save(
    item: CreateUserDto | ModifyUserDto,
    metadata: RequestMetadata,
    isNew = false,
    user: UserProfileDto,
  ): Promise<UserEntity> {
    if (isNew) {
      const searchParams: any[] = [];
      if (item.email) searchParams.push({ email: item.email.toLowerCase() });
      if (item.phone) searchParams.push({ phone: item.phone });

      if (searchParams.length > 0) {
        const existingUser = await this.repository.findOne({
          where: searchParams,
        });

        if (existingUser) {
          if (existingUser.isRegistered) {
            throw new BadRequestException('Користувач з таким email або номером телефону вже існує');
          }
          const updated = await this.repository.save({
            ...existingUser,
            ...item,
            id: existingUser.id,
          });
          if (updated.email) {
            await this.notificationSettingsRepository.upsert(
              {
                userId: updated.id,
                prefs: UserNotificationSettingsEntity.DEFAULT_PREFS,
              },
              ['userId'],
            );
            await this.confirmationsService.setupPasswordCode(updated.email, updated.id, ConfirmationTypes.REGISTRATION);
          }
          await this.userActivitiesService.logActivity(UserActivityTypes.createUser, metadata, { userId: updated.id });
          return updated;
        }
      }
    }

    if (!isNew && 'id' in item) {
      ensureSameUser(item.id, user.id);
      const exists = await this.repository.existsBy({ id: item.id });
      if (!exists) throw new NotFoundException(`Користувача з id = ${item.id} не знайдено`);
    }

    if (!item.fullName && item.firstName && item.lastName) {
      item.fullName = `${item.firstName} ${item.lastName}`.trim();
    }

    if (isNew) {
      (item as any).notificationSettings = this.notificationSettingsRepository.create({
        prefs: UserNotificationSettingsEntity.DEFAULT_PREFS,
      });
    }

    const saved = await this.repository.save(item);
    const userActivityType = isNew ? UserActivityTypes.createUser : UserActivityTypes.modifyUser;
    if (isNew) {
      await this.confirmationsService.setupPasswordCode(saved.email, saved.id, ConfirmationTypes.REGISTRATION);
    }
    await this.userActivitiesService.logActivity(userActivityType, metadata, { userId: saved.id });
    return saved;
  }

  async resetPassword(userId: string, _metadata: RequestMetadata): Promise<{ success: boolean; message: string }> {
    const user = await this.repository.findOne({ where: { id: userId } });
    if (!user || !user.email) throw new NotFoundException('Користувача не знайдено');
    await this.confirmationsService.setupPasswordCode(user.email, userId, ConfirmationTypes.PASSWORD_RESET);
    return { success: true, message: 'Код для скидання паролю надіслано на пошту' };
  }

  public async remove(id: string, user: UserProfileDto, metadata: RequestMetadata): Promise<{ success: boolean }> {
    ensureSameUser(id, user.id);
    const userToDelete = await this.repository.findOne({ where: { id } });
    if (!userToDelete) throw new NotFoundException(`Користувача не знайдено`);

    userToDelete.email = null;
    userToDelete.phone = null;
    userToDelete.fcmToken = null;
    userToDelete.firstName = '';
    userToDelete.lastName = '';
    userToDelete.middleName = null;

    await this.repository.save(userToDelete);
    await this.userActivitiesService.logActivity(UserActivityTypes.deleteAccount, metadata, { userId: user.id });

    return { success: true };
  }

  async findByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    return this.repository.find({ where: { id: In(ids) } });
  }

  async exists(id: string): Promise<boolean> {
    return this.repository.existsBy({ id });
  }

  async findOneInternal(id: string): Promise<UserEntity | null> {
    return this.repository.findOneBy({ id });
  }

  async updateLastPersonalRollCallAt(id: string): Promise<void> {
    await this.repository.update({ id }, { lastPersonalRollCallAt: new Date() });
  }
}
