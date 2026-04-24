import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfirmationsModule } from 'src/confirmations/confirmations.module';
import { SecurityModule } from 'src/security/security.module';
import { UserActivitiesModule } from 'src/user-activities/user-activities.module';
import { UserEntity } from 'src/users/entities/user.entity';
import { UserPasswordEntity } from 'src/users/entities/user-password.entity';
import { UserSessionEntity } from 'src/users/entities/user-sessions.entity';
import { UsersModule } from 'src/users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserJwtAccessStrategy } from './strategies/user-jwt-access.strategy';
import { UserJwtRefreshStrategy } from './strategies/user-jwt-refresh.strategy';
import { UserLocalStrategy } from './strategies/user-local.strategy';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([UserEntity, UserPasswordEntity, UserSessionEntity]),
    UserActivitiesModule,
    SecurityModule,
    ConfirmationsModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserLocalStrategy, UserJwtAccessStrategy, UserJwtRefreshStrategy],
})
export class AuthModule {}
