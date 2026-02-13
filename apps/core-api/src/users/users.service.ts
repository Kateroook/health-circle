import { Injectable, NotFoundException, NotImplementedException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserPasswordEntity } from 'src/common/entities/user-password.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { UserStatus } from 'src/common/enums/user-status';
import { ensureSameUser } from 'src/common/helpers/ensure-same-user.util';
import { RequestMetadata } from 'src/common/types/request-metadata';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { ConfirmationTypes } from 'src/confirmations/enums/confirmation-type';
import { ExternalFilesService } from 'src/external-files/external-files.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { EntityManager, QueryRunner, Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';

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
  ) {}

  async updateStatus(userId: string, status: UserStatus) {
    const user = await this.repository.findOne({
      where: { id: userId },
      relations: ['groups', 'groups.members'],
    });
    if (!user) return;

    user.status = status;
    user.lastStatusUpdate = new Date();
    await this.repository.save(user);
    const tokens = new Set<string>();
    user.groups.forEach((group) => {
      group.members.forEach((member) => {
        if (member.id !== userId && member.fcmToken) {
          tokens.add(member.fcmToken);
        }
      });
    });

    let title = 'Оновлення статусу';
    let body = `${user.firstName} оновив статус`;

    if (status === UserStatus.DANGER) {
      title = '🆘 ПОТРІБНА ДОПОМОГА!';
      body = `${user.firstName} ${user.lastName} потребує допомоги!`;
    } else if (status === UserStatus.SAFE) {
      title = '✅ У безпеці';
      body = `${user.firstName} ${user.lastName} зараз у безпеці.`;
    }

    if (tokens.size > 0) {
      await this.notificationsService.sendMulticast(Array.from(tokens), title, body, {
        userId: user.id,
        status: status,
      });
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
    await entityManager.save(UserEntity, user);
  }

  private getOneQueryBuilder() {
    return this.repository.createQueryBuilder('users');
  }

  public async getOne(id: string, user: UserProfileDto): Promise<UserEntity> {
    ensureSameUser(id, user.id);
    const targetUser = await this.getOneQueryBuilder().where('users.id = :id', { id }).getOne();
    if (!targetUser) throw new NotFoundException(`Користувача з id = ${id} не знайдено`);
    return targetUser;
  }

  public async save(
    item: CreateUserDto | ModifyUserDto,
    metadata: RequestMetadata,
    isNew = false,
    user: UserProfileDto,
  ): Promise<UserEntity> {
    if (!isNew && 'id' in item) {
      ensureSameUser(item.id, user.id);
      const exists = await this.repository.existsBy({ id: item.id });
      if (!exists) throw new NotFoundException(`Користувача з id = ${item.id} не знайдено`);
    }
    const saved = await this.repository.save(item);
    const userActivityType = isNew ? UserActivityTypes.createUser : UserActivityTypes.modifyUser;
    if (isNew) await this.confirmationsService.setupPasswordCode(saved.email, saved.id, ConfirmationTypes.REGISTRATION);
    await this.userActivitiesService.logActivity(userActivityType, metadata, { userId: saved.id });
    return saved;
  }

  async resetPassword(_userId: string, _metadata: RequestMetadata): Promise<void> {
    // todo: change to reset by email
    throw new NotImplementedException();
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
    userToDelete.middleName = '';

    await this.repository.save(userToDelete);
    await this.userActivitiesService.logActivity(UserActivityTypes.deleteAccount, metadata, { userId: user.id });

    return { success: true };
  }
}
