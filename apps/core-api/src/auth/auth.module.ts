import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SecurityModule } from 'security/security.module';
import { ConfirmationsModule } from 'src/confirmations/confirmations.module';
import { PostgresService } from 'src/postgres/postgres.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPasswordEntity } from 'src/common/entities/user-password.entity';
import { UserSessionEntity } from 'src/common/entities/user-sessions.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { UserActivitiesModule } from 'src/user-activities/user-activities.module';
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
  ],
  controllers: [AuthController],
  providers: [AuthService, UserLocalStrategy, UserJwtAccessStrategy, UserJwtRefreshStrategy, PostgresService],
})
export class AuthModule {}
