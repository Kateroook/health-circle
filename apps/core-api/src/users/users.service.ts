import { BadRequestException, Injectable, Logger, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AlertRegionResolverService } from 'src/alerts/alert-region-resolver.service';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { UserStatus } from 'src/common/enums/user-status';
import { ensureSameUser } from 'src/common/helpers/ensure-same-user.util';
import { QueueService } from 'src/common/queue/queue.service';
import { RequestMetadata } from 'src/common/types/request-metadata';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { ConfirmationTypes } from 'src/confirmations/enums/confirmation-type';
import { ContactEntity } from 'src/contacts/entities/contact.entity';
import { ExternalFilesService } from 'src/external-files/external-files.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import { GroupEntity } from 'src/groups/entities/group.entity';
import { GroupBlockListEntity } from 'src/groups/entities/group-block-list.entity';
import { FirestoreSyncService } from 'src/notifications/firestore-sync.service';
import { STATUS_UPDATE_SIDE_EFFECTS_QUEUE } from 'src/notifications/status-update.queue.constants';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import type { FindOptionsWhere } from 'typeorm';
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
    protected readonly externalFilesService: ExternalFilesService,
    private readonly queueService: QueueService,
    @InjectRepository(GroupEntity)
    protected readonly groupRepository: Repository<GroupEntity>,
    @InjectRepository(GroupBlockListEntity)
    protected readonly blockListRepository: Repository<GroupBlockListEntity>,
    @InjectRepository(GroupMemberEntity)
    protected readonly memberRepository: Repository<GroupMemberEntity>,
    @InjectRepository(ContactEntity)
    protected readonly contactRepository: Repository<ContactEntity>,
    @InjectRepository(UserNotificationSettingsEntity)
    protected readonly notificationSettingsRepository: Repository<UserNotificationSettingsEntity>,
    private readonly alertRegionResolver: AlertRegionResolverService,
    private readonly geocodingService: GeocodingService,
    private readonly firestoreSyncService: FirestoreSyncService,
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
        const enabled = settings ? settings.enabled : true;
        if (!enabled) return false;

        const prefs = settings?.prefs ?? UserNotificationSettingsEntity.DEFAULT_PREFS;
        if (settingKey && prefs[settingKey] === false) {
          return false;
        }
        return true;
      })
      .map((u) => u.fcmToken as string);
  }

  async getPhoneNumbersForUsers(userIds: string[], settingKey?: string): Promise<string[]> {
    const users = await this.repository.find({
      where: { id: In(userIds) },
      select: ['id', 'phone'],
      relations: ['notificationSettings'],
    });

    return users
      .filter((u) => {
        if (!u.phone) return false;
        const settings = u.notificationSettings;
        const enabled = settings ? settings.enabled : true;
        if (!enabled) return false;

        const prefs = settings?.prefs ?? UserNotificationSettingsEntity.DEFAULT_PREFS;
        if (settingKey && prefs[settingKey] === false) {
          return false;
        }
        return true;
      })
      .map((u) => u.phone as string);
  }

  private async isAvatarViewAllowed(targetUserId: string, requesterUserId: string): Promise<boolean> {
    if (targetUserId === requesterUserId) return true;

    // Allow avatar access only when requester and target share at least one group.
    // We use a single query with a self-join on group_members to check for common groupIds.
    return this.memberRepository
      .createQueryBuilder('m1')
      .innerJoin(GroupMemberEntity, 'm2', 'm1.groupId = m2.groupId')
      .where('m1.userId = :requesterUserId', { requesterUserId })
      .andWhere('m2.userId = :targetUserId', { targetUserId })
      .limit(1)
      .getExists();
  }

  async updateStatus(userId: string, status: UserStatus, options?: { memberUserIds?: string[] }) {
    const user = await this.repository.findOne({
      where: { id: userId },
    });
    if (!user) return;

    user.status = status;
    user.lastStatusUpdate = new Date();
    await this.repository.save(user);

    // If memberUserIds are not provided, find all members from all groups the user belongs to
    let targetMemberIds = options?.memberUserIds;
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

    // Offload FCM + Firestore sync to pg-boss worker to keep API latency low.
    const memberUserIds = targetMemberIds ?? [];
    void this.queueService
      .send(STATUS_UPDATE_SIDE_EFFECTS_QUEUE, {
        senderUserId: userId,
        status,
        memberUserIds,
      })
      .catch((error: unknown) => {
        this.logger.error({ error }, 'Failed to enqueue status side-effects');
      });

    return { status: user.status, message: 'Status updated' };
  }

  async getUserForStatusNotifications(
    userId: string,
  ): Promise<Pick<UserEntity, 'id' | 'firstName' | 'lastName' | 'fcmToken'> | null> {
    return this.repository.findOne({
      where: { id: userId },
      select: ['id', 'firstName', 'lastName', 'fcmToken'],
    });
  }

  async saveFcmToken(userId: string, token: string) {
    await this.repository.update({ id: userId }, { fcmToken: token });
    return { message: 'Token updated' };
  }

  async upsertFile(
    userId: string,
    file: Express.Multer.File,
    currentUserId: string,
    queryRunner?: QueryRunner,
  ): Promise<UserEntity> {
    ensureSameUser(userId, currentUserId);
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

  async getFile(userId: string, currentUserId: string): Promise<StreamableFile> {
    const allowed = await this.isAvatarViewAllowed(userId, currentUserId);
    if (!allowed) throw new NotFoundException('Користувача або файл не знайдено');

    const user = await this.repository.findOne({ where: { id: userId }, relations: ['file'] });
    if (!user || !user.file) throw new NotFoundException('Користувача або файл не знайдено');
    return this.externalFilesService.getStreamableFile(user.file);
  }

  async removeFile(userId: string, currentUserId: string, manager?: EntityManager): Promise<void> {
    ensureSameUser(userId, currentUserId);
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
      const searchParams: FindOptionsWhere<UserEntity>[] = [];
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

    // Auto-resolve alertRegionUid from coordinates OR region/district text
    if (!item.alertRegionUid) {
      if (item.latitude && item.longitude) {
        // Step 1: Reverse geocode to get reliable Ukrainian names
        const geo = await this.geocodingService.reverseGeocode(item.latitude, item.longitude);
        if (geo) {
          // Auto-fill region/district strings if they are missing
          if (!item.region) item.region = geo.region || undefined;
          if (!item.district) item.district = geo.district || geo.city || undefined;

          // Step 2: Resolve the UID using these reliable names
          const resolvedUid = await this.alertRegionResolver.resolve(
            geo.region || undefined,
            geo.district || geo.city || undefined,
          );
          if (resolvedUid) {
            item.alertRegionUid = resolvedUid;
          }
        }
      } else if (item.region || item.district) {
        // Fallback to string-based resolution if no coordinates
        const resolvedUid = await this.alertRegionResolver.resolve(item.region, item.district);
        if (resolvedUid) {
          item.alertRegionUid = resolvedUid;
        }
      }
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

  private async collectImpactedUserIds(userId: string): Promise<Set<string>> {
    const impactedUserIds = new Set<string>();

    const memberships = await this.memberRepository.find({
      where: { userId },
      select: ['groupId'],
    });

    const ownerGroups = await this.groupRepository.find({
      where: { ownerId: userId },
      select: ['id'],
    });

    const groupIds = Array.from(
      new Set([...memberships.map((membership) => membership.groupId), ...ownerGroups.map((group) => group.id)]),
    );

    if (groupIds.length > 0) {
      const relatedMemberships = await this.memberRepository.find({
        where: { groupId: In(groupIds) },
        select: ['userId'],
      });

      relatedMemberships.forEach((membership) => {
        if (membership.userId !== userId) {
          impactedUserIds.add(membership.userId);
        }
      });
    }

    return impactedUserIds;
  }

  private async cleanupUserRelations(userId: string): Promise<Set<string>> {
    const impactedUserIds = await this.collectImpactedUserIds(userId);

    const ownerGroups = await this.groupRepository.find({
      where: { ownerId: userId },
      select: ['id'],
    });
    const ownerGroupIds = ownerGroups.map((group) => group.id);

    if (ownerGroupIds.length > 0) {
      await this.blockListRepository.delete({ groupId: In(ownerGroupIds) });
      await this.memberRepository.delete({ groupId: In(ownerGroupIds) });
      await this.groupRepository.delete({ id: In(ownerGroupIds) });
    }

    await this.memberRepository.delete({ userId });
    await this.contactRepository.delete([{ ownerId: userId }, { targetId: userId }]);

    return impactedUserIds;
  }

  public async remove(id: string, user: UserProfileDto, metadata: RequestMetadata): Promise<{ success: boolean }> {
    ensureSameUser(id, user.id);
    await this.userActivitiesService.logActivity(UserActivityTypes.deleteAccount, metadata, { userId: user.id });
    const impactedUserIds = await this.cleanupUserRelations(id);
    const result = await this.repository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Користувача не знайдено`);
    await this.firestoreSyncService.sendSyncSignal(Array.from(impactedUserIds));
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

  private async resolveAlertRegionUid(region?: string, district?: string): Promise<number | null> {
    return this.alertRegionResolver.resolve(region, district);
  }
}
