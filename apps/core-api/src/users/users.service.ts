import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/common/entities/user.entity';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { SetupPasswordReasons } from 'src/confirmations/enums/setup-password-reasons';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { Repository } from 'typeorm';

import { UserPasswordEntity } from 'src/common/entities/user-password.entity';
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
    return this.repository.createQueryBuilder('users').leftJoinAndSelect('users.roles', 'roles');
  }

  public async getOne(id: string) {
    const user = await this.getOneQueryBuilder().where('users.id = :id', { id }).getOne();
    if (!user) throw new NotFoundException(`Користувача з id = ${id} не знайдено`);
    return user;
  }

  public async save(item: CreateUserDto | ModifyUserDto, isNew = false): Promise<UserEntity> {
    if (!isNew && 'id' in item) {
      const user = await this.repository.findOneBy({ id: item.id });
      if (!user) throw new NotFoundException(`Користувача з id = ${item.id} не знайдено`);
    }
    const user = await this.repository.save(item);
    if (isNew && user) {
      await this.confirmationsService.setupPasswordCode(user.email, user.id, SetupPasswordReasons.setup);
    }
    return user;
  }

  async resetPassword(userId: string, metadata: RequestMetadata) {
    // todo: change to reset by email
    throw new NotImplementedException('Reset is not implemented');
  }
}
