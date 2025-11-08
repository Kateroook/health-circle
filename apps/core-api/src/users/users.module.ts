import { Module } from '@nestjs/common';
import { ConfirmationsModule } from 'src/confirmations/confirmations.module';
import { PostgresService } from 'src/postgres/postgres.service';
import { SecurityService } from 'src/security/security.service';
import { UserActivitiesModule } from 'src/user-activities/user-activities.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserUniqueConstraint } from 'src/common/constraints/user-unique.constraint';
import { UserPasswordEntity } from 'src/common/entities/user-password.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserPasswordEntity]), UserActivitiesModule, ConfirmationsModule],
  providers: [UsersService, PostgresService, SecurityService, UserUniqueConstraint],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
