import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/common/entities/user.entity';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { SetupPasswordReasons } from 'src/confirmations/enums/setup-password-reasons';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { Repository } from 'typeorm';

import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserPasswordEntity } from 'src/common/entities/user-password.entity';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { ensureSameUser } from 'src/common/helpers/ensure-same-user.util';
import { RequestMetadata } from 'src/common/types/request-metadata';
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
  ) {}

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
    if (isNew) await this.confirmationsService.setupPasswordCode(saved.email, user.id, SetupPasswordReasons.setup);
    await this.userActivitiesService.logActivity(userActivityType, metadata, { userId: user.id });
    return saved;
  }

  async resetPassword(userId: string, metadata: RequestMetadata) {
    // todo: change to reset by email
    throw new NotImplementedException('Reset is not implemented');
  }
}
