import { BadRequestException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
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
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { EntityManager, In, QueryRunner, Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserPasswordEntity } from './entities/user-password.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    protected readonly repository: Repository<UserEntity>,
    @InjectRepository(UserPasswordEntity)
    protected readonly passwordRepository: Repository<UserPasswordEntity>,
    protected readonly confirmationsService: ConfirmationsService,
    protected readonly userActivitiesService: UserActivitiesService,
    protected readonly configService: ConfigService,
    protected readonly externalFilesService: ExternalFilesService,
    private notificationsService: NotificationsService,
    private firestoreSyncService: FirestoreSyncService,
  ) {}

  async updateStatus(userId: string, status: UserStatus, groupMemberIds?: string[]) {
    const user = await this.repository.findOne({
      where: { id: userId },
    });
    if (!user) return;

    user.status = status;
    user.lastStatusUpdate = new Date();
    await this.repository.save(user);

    // In a truly decoupled system, groupMemberIds would come from an event listener or a dedicated service call
    if (groupMemberIds && groupMemberIds.length > 0) {
      const membersWithTokens = await this.repository.find({
        where: { id: In(groupMemberIds), fcmToken: In([...groupMemberIds]) }, // Simplistic filter for tokens
        select: ['id', 'fcmToken'],
      });

      const tokens = membersWithTokens.filter((m) => m.id !== userId && m.fcmToken).map((m) => m.fcmToken as string);

      if (tokens.length > 0) {
        let title = 'Оновлення статусу';
        let body = `${user.firstName} оновив статус`;

        if (status === UserStatus.DANGER) {
          title = '🆘 ПОТРІБНА ДОПОМОГА!';
          body = `${user.firstName} ${user.lastName} потребує допомоги!`;
        } else if (status === UserStatus.SAFE) {
          title = '✅ У безпеці';
          body = `${user.firstName} ${user.lastName} зараз у безпеці.`;
        } else if (status === UserStatus.WAS_SAFE) {
          title = '💡 Був у безпеці';
          body = `Статус ${user.firstName} ${user.lastName} змінено на "Був у безпеці".`;
        }

        await this.notificationsService.sendMulticast(tokens, title, body, {
          userId: user.id,
          status: status,
        });
      }

      await this.firestoreSyncService.sendSyncSignal([...groupMemberIds, userId]);
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

    const saved = await this.repository.save(item);
    const userActivityType = isNew ? UserActivityTypes.createUser : UserActivityTypes.modifyUser;
    if (isNew) await this.confirmationsService.setupPasswordCode(saved.email, saved.id, ConfirmationTypes.REGISTRATION);
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

    await this.userActivitiesService.logActivity(UserActivityTypes.deleteAccount, metadata, { userId: user.id });
    await this.repository.remove(userToDelete);

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
