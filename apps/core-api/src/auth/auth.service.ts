import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserSessionEntity } from 'src/common/entities/user-sessions.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { SecurityService } from 'src/security/security.service';
import { IsNull, Repository } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { UserPasswordEntity } from 'src/common/entities/user-password.entity';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { RequestMetadata } from '../common/types/request-metadata';
import { ConfirmationTypes } from '../confirmations/enums/confirmation-type';
import { UserSetupPasswordDto } from './dto/user-setup-password.dto';
import { UserTokenDto } from './dto/user-token.dto';
import { UserTokenPayload } from './types/user-token-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserPasswordEntity) private readonly userPasswordRepository: Repository<UserPasswordEntity>,
    @InjectRepository(UserSessionEntity) private readonly userSessionRepository: Repository<UserSessionEntity>,
    private readonly securityService: SecurityService,
    private readonly userActivitiesService: UserActivitiesService,
    private readonly confirmationService: ConfirmationsService,
  ) {}

  private async getAccessToken(userId: string): Promise<UserTokenDto> {
    const jti = randomUUID();
    const issuedAt = new Date();
    const expiresIn = this.configService.getOrThrow<number>('ACCESS_TOKEN_TTL') * 1000;
    const expiresAt = new Date(issuedAt.getTime() + expiresIn);

    const tokenPayload: UserTokenPayload = {
      sub: userId,
      jti,
    };

    const token = await this.jwtService.signAsync(tokenPayload, {
      secret: this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
      expiresIn,
    });

    return {
      jti,
      token,
      tokenType: 'Bearer',
      expiresIn,
      issuedAt,
      expiresAt,
    };
  }

  private async getRefreshToken(userId: string, jti: string): Promise<UserTokenDto> {
    const issuedAt = new Date();
    const expiresIn = this.configService.getOrThrow<number>('REFRESH_TOKEN_TTL') * 1000;
    const expiresAt = new Date(issuedAt.getTime() + expiresIn);
    const scope = '/auth/refresh';

    const tokenPayload: UserTokenPayload = {
      sub: userId,
      jti,
    };

    const token = await this.jwtService.signAsync(tokenPayload, {
      audience: scope,
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn,
    });

    return {
      jti: randomUUID(),
      token,
      tokenType: 'Bearer',
      expiresIn,
      issuedAt,
      expiresAt,
    };
  }

  async validateUser(email: string, password: string, metadata: RequestMetadata): Promise<UserProfileDto> {
    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    // Check if user exists and is active
    if (!user) throw new UnauthorizedException('Невірні облікові дані');
    if (user.lockedAt) throw new ForbiddenException('Користувача заблоковано');
    // Validate password
    const userPassword = await this.userPasswordRepository.findOne({
      where: { user: { id: user.id }, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!userPassword || !(await this.securityService.validate(password, userPassword.passwordHash))) {
      await this.userActivitiesService.logActivity(UserActivityTypes.userFailedLogin, metadata, { userId: user.id });
      throw new UnauthorizedException('Невірні облікові дані');
    }
    return new UserProfileDto({ ...user });
  }

  async verifyUser(tokenPayload: UserTokenPayload, metadata: RequestMetadata): Promise<UserProfileDto> {
    const session = await this.userSessionRepository.findOne({
      where: { jti: tokenPayload.jti, user: { id: tokenPayload.sub } },
      relations: { user: true },
    });
    // Check if session is not revoked and not expired
    if (!session) throw new UnauthorizedException('Сеанс недійсний або завершений');
    // Check if user exists and is active
    const { user } = session;
    if (user.lockedAt) throw new ForbiddenException('Користувача заблоковано');
    // Update lastUsedAt, deviceInfo and ip for session
    await this.userSessionRepository.save({
      id: session.id,
      lastUsedAt: new Date(),
      deviceInfo: metadata.deviceInfo,
      ipAddress: metadata.ipAddress,
    });
    return new UserProfileDto({ ...user, sessionId: session.id });
  }

  async verifySession(token: string, tokenPayload: UserTokenPayload): Promise<UserProfileDto> {
    const session = await this.userSessionRepository.findOne({
      where: { jti: tokenPayload.jti, user: { id: tokenPayload.sub } },
      relations: { user: true },
    });
    // Check if session is not revoked and not expired and matches session tokenHash
    if (!session || !(await this.securityService.validate(token, session.tokenHash)))
      throw new UnauthorizedException('Сеанс недійсний або завершений');
    // Check if user exists and is active
    const { user } = session;
    if (user.lockedAt) throw new ForbiddenException('Користувача заблоковано');
    return new UserProfileDto({ ...user, sessionId: session.id });
  }

  async login(user: UserProfileDto, metadata: RequestMetadata, response: Response) {
    const accessToken = await this.getAccessToken(user.id);
    const refreshToken = await this.getRefreshToken(user.id, accessToken.jti!);
    // Revoke all user active sessions
    const sessions = await this.userSessionRepository.find({ where: { user: { id: user.id }, revokedAt: IsNull() } });
    const revokedAt = new Date();
    sessions.forEach((session) => (session.revokedAt = revokedAt));
    // Create session in DB with jti, userId, userAgent, device info, ip, expiresAt, tokenHash
    // Update lastLoginAt, FailedLoginAttempts, etc.
    const session = this.userSessionRepository.create({
      user: { id: user.id, lastLoginDate: new Date(), failedLoginAttempts: 0 },
      userAgent: metadata.userAgent,
      deviceInfo: metadata.deviceInfo,
      ipAddress: metadata.ipAddress,
      expiresAt: refreshToken.expiresAt,
      tokenHash: await this.securityService.hash(refreshToken.token),
      jti: accessToken.jti,
      lastUsedAt: new Date(),
    });
    sessions.push(session);
    await this.userSessionRepository.save(sessions);
    await this.userActivitiesService.logActivity(UserActivityTypes.userLogin, metadata, { userId: user.id });
    // Set refresh token in HttpOnly cookie
    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      tokenType: 'Bearer',
      expiresIn: accessToken.expiresIn,
      issuedAt: accessToken.issuedAt,
      expiresAt: accessToken.expiresAt,
    };
  }

  async refresh(user: UserProfileDto, metadata: RequestMetadata, response: Response) {
    const accessToken = await this.getAccessToken(user.id);
    const refreshToken = await this.getRefreshToken(user.id, accessToken.jti!);
    // Update current user session with new jti, userAgent, device info, ip, expiresAt, tokenHash
    await this.userSessionRepository.save({
      id: user.sessionId,
      userAgent: metadata.userAgent,
      deviceInfo: metadata.deviceInfo,
      ipAddress: metadata.ipAddress,
      expiresAt: refreshToken.expiresAt,
      tokenHash: await this.securityService.hash(refreshToken.token),
      jti: accessToken.jti,
      lastUsedAt: new Date(),
    });
    // Set refresh token in HttpOnly cookie
    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      tokenType: 'Bearer',
      expiresIn: accessToken.expiresIn,
      issuedAt: accessToken.issuedAt,
      expiresAt: accessToken.expiresAt,
    };
  }

  async logout(user: UserProfileDto, metadata: RequestMetadata) {
    await this.userSessionRepository.save({
      id: user.sessionId,
      revokedAt: new Date(),
    });
    await this.userActivitiesService.logActivity(UserActivityTypes.userLogout, metadata, { userId: user.id });
    return { success: true };
  }

  async setupPassword(user: UserProfileDto, data: UserSetupPasswordDto): Promise<void> {
    // Validate password and confirmPassword match
    const { newPassword, confirmNewPassword } = data;
    if (newPassword !== confirmNewPassword) throw new ForbiddenException('Новий пароль та підтвердження не співпадають');
    // Validate whether user already has an active password
    const userPassword = await this.userPasswordRepository.findOne({
      where: { user: { id: user.id }, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    // Check if user already has an active password
    if (userPassword) throw new ForbiddenException('Користувач вже має активний пароль для входу');
    // TODO: Restrict using last 5 passwords
    // Hash new password and save to DB
    const passwordHash = await this.securityService.hash(newPassword);
    await this.userPasswordRepository.save({
      user: { id: user.id },
      passwordHash,
    });
    // Consume the setup token
    await this.confirmationService.consumeToken(ConfirmationTypes.setupPassword, user.id);
  }
}
