import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import type { Response } from 'express';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserActivityTypes } from 'src/common/enums/user-activity-types';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { ConfirmationTypes } from 'src/confirmations/enums/confirmation-type';
import { SecurityService } from 'src/security/security.service';
import { UserActivitiesService } from 'src/user-activities/user-activities.service';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';

import { RequestMetadata } from '../common/types/request-metadata';
import { UserEntity } from '../users/entities/user.entity';
import { UserPasswordEntity } from '../users/entities/user-password.entity';
import { UserSessionEntity } from '../users/entities/user-sessions.entity';
import { SessionActivityService } from '../users/session-activity.service';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserSetupPasswordDto } from './dto/user-setup-password.dto';
import { UserTokenDto } from './dto/user-token.dto';
import { UserTokenPayload } from './types/user-token-payload';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserPasswordEntity) private readonly userPasswordRepository: Repository<UserPasswordEntity>,
    @InjectRepository(UserSessionEntity) private readonly userSessionRepository: Repository<UserSessionEntity>,
    private readonly securityService: SecurityService,
    private readonly userActivitiesService: UserActivitiesService,
    private readonly confirmationService: ConfirmationsService,
    private readonly sessionActivityService: SessionActivityService,
  ) {}

  private generateFingerprint(metadata: RequestMetadata): string {
    const raw = `${metadata.userAgent}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  private async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const criteria: Record<string, unknown> = { user: { id: userId }, revokedAt: IsNull() };
    if (exceptSessionId) {
      criteria.id = Not(exceptSessionId);
    }
    await this.userSessionRepository.update(criteria, { revokedAt: new Date() });
  }

  private async getAccessToken(userId: string, fingerprint?: string): Promise<UserTokenDto> {
    const jti = randomUUID();
    const issuedAt = new Date();
    const expiresInSeconds = this.configService.getOrThrow<number>('ACCESS_TOKEN_TTL');
    const expiresAt = new Date(issuedAt.getTime() + expiresInSeconds * 1000);

    const tokenPayload: UserTokenPayload = {
      sub: userId,
      jti,
      fgp: fingerprint,
    };

    const token = await this.jwtService.signAsync(tokenPayload, {
      secret: this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: expiresInSeconds,
    });

    return {
      jti,
      token,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      issuedAt,
      expiresAt,
    };
  }

  private async getRefreshToken(userId: string, jti: string, fingerprint?: string): Promise<UserTokenDto> {
    const issuedAt = new Date();
    const expiresInSeconds = this.configService.getOrThrow<number>('REFRESH_TOKEN_TTL');
    const expiresAt = new Date(issuedAt.getTime() + expiresInSeconds * 1000);
    const scope = '/auth/refresh';

    const tokenPayload: UserTokenPayload = {
      sub: userId,
      jti,
      fgp: fingerprint,
    };

    const token = await this.jwtService.signAsync(tokenPayload, {
      audience: scope,
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: expiresInSeconds,
    });

    return {
      jti: randomUUID(),
      token,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      issuedAt,
      expiresAt,
    };
  }

  private getSmsTargetNumber(): string | undefined {
    return this.configService.get<string>('TWILIO_PHONE_NUMBER');
  }

  async validateUser(identifier: string, password: string, metadata: RequestMetadata): Promise<UserProfileDto> {
    // Find user by email or phone
    const user = await this.userRepository.findOne({
      where: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });

    // Check if user exists and is active
    if (!user) throw new UnauthorizedException('Невірні облікові дані');
    if (user.lockedAt) throw new ForbiddenException('Користувача заблоковано');

    // Check if registration is completed
    if (!user.isRegistered) {
      throw new BadRequestException('INCOMPLETE_REGISTRATION');
    }

    // Validate password
    const userPassword = await this.userPasswordRepository.findOne({
      where: { user: { id: user.id }, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    const maxAttempts = this.configService.get<number>('MAX_FAILED_LOGIN_ATTEMPTS') || 5;

    if (!userPassword || !(await this.securityService.validate(password, userPassword.passwordHash))) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= maxAttempts) {
        user.lockedAt = new Date();
      }
      await this.userRepository.save(user);

      await this.userActivitiesService.logActivity(UserActivityTypes.userFailedLogin, metadata, { userId: user.id });
      throw new UnauthorizedException('Неправильний логін або пароль');
    }

    return new UserProfileDto({ ...user, smsTargetNumber: this.getSmsTargetNumber() });
  }

  async verifyUser(tokenPayload: UserTokenPayload, metadata: RequestMetadata): Promise<UserProfileDto> {
    const session = await this.userSessionRepository.findOne({
      where: { jti: tokenPayload.jti, user: { id: tokenPayload.sub }, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      relations: { user: true },
    });

    // Check if session is not revoked and not expired
    if (!session) throw new UnauthorizedException('Сеанс недійсний або завершений');
    if (session.revokedAt) throw new UnauthorizedException('Сеанс відкликано');
    if (!session.expiresAt || session.expiresAt <= new Date()) throw new UnauthorizedException('Сеанс протерміновано');

    // Verify fingerprint: allow mismatch if it's a legacy fingerprint (from before IP removal)
    // but only if session fingerprint matches token payload fingerprint AND user agent matches.
    const currentFingerprint = this.generateFingerprint(metadata);
    const isFingerprintMismatch = session.fingerprint !== currentFingerprint || tokenPayload.fgp !== currentFingerprint;

    if (session.fingerprint && isFingerprintMismatch) {
      const isLegacyMatch = session.fingerprint === tokenPayload.fgp && session.userAgent === metadata.userAgent;
      if (!isLegacyMatch) {
        throw new UnauthorizedException('Спроба захоплення сеансу');
      }
    }

    // Check if user exists and is active
    const { user } = session;
    if (user.lockedAt) throw new ForbiddenException('Користувача заблоковано');

    // Debounced update of lastUsedAt, deviceInfo and ip for session
    this.sessionActivityService.trackActivity(session.id, metadata.ipAddress || '0.0.0.0', metadata.deviceInfo);

    return new UserProfileDto({ ...user, sessionId: session.id, smsTargetNumber: this.getSmsTargetNumber() });
  }

  async verifySession(token: string, tokenPayload: UserTokenPayload, metadata: RequestMetadata): Promise<UserProfileDto> {
    const session = await this.userSessionRepository.findOne({
      where: { jti: tokenPayload.jti, user: { id: tokenPayload.sub }, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      relations: { user: true },
    });

    if (!session) throw new UnauthorizedException('Сеанс недійсний або завершений');
    if (session.revokedAt) throw new UnauthorizedException('Сеанс відкликано');
    if (!session.expiresAt || session.expiresAt <= new Date()) throw new UnauthorizedException('Сеанс протерміновано');

    // Check if session matches current refresh token (tokenHash)
    if (!(await this.securityService.validateToken(token, session.tokenHash))) {
      throw new UnauthorizedException('Сеанс недійсний або завершений');
    }

    // Verify fingerprint: allow legacy fingerprints if UA matches
    const currentFingerprint = this.generateFingerprint(metadata);
    const isFingerprintMismatch = session.fingerprint !== currentFingerprint || tokenPayload.fgp !== currentFingerprint;

    if (session.fingerprint && isFingerprintMismatch) {
      const isLegacyMatch = session.fingerprint === tokenPayload.fgp && session.userAgent === metadata.userAgent;
      if (!isLegacyMatch) {
        throw new UnauthorizedException('Спроба захоплення сеансу');
      }
    }

    // Check if user exists and is active
    const { user } = session;
    if (user.lockedAt) throw new ForbiddenException('Користувача заблоковано');
    return new UserProfileDto({ ...user, sessionId: session.id, smsTargetNumber: this.getSmsTargetNumber() });
  }

  async login(user: UserProfileDto, metadata: RequestMetadata, _response: Response) {
    const fingerprint = this.generateFingerprint(metadata);
    const accessToken = await this.getAccessToken(user.id, fingerprint);
    const refreshToken = await this.getRefreshToken(user.id, accessToken.jti!, fingerprint);

    // Revoke all user active sessions
    const sessions = await this.userSessionRepository.find({ where: { user: { id: user.id }, revokedAt: IsNull() } });
    const revokedAt = new Date();
    sessions.forEach((session) => (session.revokedAt = revokedAt));

    // Create session in DB
    const session = this.userSessionRepository.create({
      user: { id: user.id },
      userAgent: metadata.userAgent,
      deviceInfo: metadata.deviceInfo,
      ipAddress: metadata.ipAddress,
      expiresAt: refreshToken.expiresAt,
      tokenHash: await this.securityService.hashToken(refreshToken.token),
      jti: accessToken.jti,
      lastUsedAt: new Date(),
      fingerprint,
    });
    sessions.push(session);
    await this.userSessionRepository.save(sessions);

    // Update lastLoginDate for user
    await this.userRepository.update(user.id, { lastLoginDate: new Date(), failedLoginAttempts: 0 });

    await this.userActivitiesService.logActivity(UserActivityTypes.userLogin, metadata, { userId: user.id });

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      tokenType: 'Bearer',
      expiresIn: accessToken.expiresIn,
      issuedAt: accessToken.issuedAt,
      expiresAt: accessToken.expiresAt,
    };
  }

  async refresh(user: UserProfileDto, metadata: RequestMetadata, _response: Response) {
    const fingerprint = this.generateFingerprint(metadata);
    const accessToken = await this.getAccessToken(user.id, fingerprint);
    const refreshToken = await this.getRefreshToken(user.id, accessToken.jti!, fingerprint);

    // Update current user session
    const tokenHash = await this.securityService.hashToken(refreshToken.token);

    if (!user.sessionId) {
      throw new UnauthorizedException('Сеанс недійсний або завершений');
    }

    await this.userSessionRepository.update(user.sessionId, {
      userAgent: metadata.userAgent,
      deviceInfo: metadata.deviceInfo,
      ipAddress: metadata.ipAddress,
      expiresAt: refreshToken.expiresAt,
      tokenHash,
      jti: accessToken.jti,
      lastUsedAt: new Date(),
      fingerprint,
    });

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
    if (!user.sessionId) {
      throw new UnauthorizedException('Сеанс недійсний або завершений');
    }

    await this.userSessionRepository.update(user.sessionId, {
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
    await this.confirmationService.consumeToken(user.id);

    // Mark as registered
    await this.userRepository.save({ id: user.id, isRegistered: true });
  }

  async changePassword(user: UserProfileDto, data: UserChangePasswordDto): Promise<void> {
    const { oldPassword, newPassword, confirmNewPassword } = data;
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Новий пароль та підтвердження не співпадають');
    }
    // Find current active password
    const currentPassword = await this.userPasswordRepository.findOne({
      where: { user: { id: user.id }, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (!currentPassword) throw new NotFoundException('Активний пароль не знайдено');
    // Verify old password
    const isOldPasswordValid = await this.securityService.validate(oldPassword, currentPassword.passwordHash);
    if (!isOldPasswordValid) throw new UnauthorizedException('Невірний поточний пароль');
    // Revoke old password
    currentPassword.revokedAt = new Date();
    await this.userPasswordRepository.save(currentPassword);
    // Hash and save new password
    const passwordHash = await this.securityService.hash(newPassword);
    await this.userPasswordRepository.save({
      user: { id: user.id },
      passwordHash,
    });

    // Revoke other sessions but keep current one alive so the client can cleanly logout.
    await this.revokeAllSessions(user.id, user.sessionId);
  }

  async forgotPassword(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (!user) return false;

    if (user.lockedAt) {
      throw new ForbiddenException('Цей обліковий запис заблоковано');
    }
    if (!user.isRegistered) {
      throw new BadRequestException('Пошта не підтверджена. Повторно надішліть код підтвердження');
    }

    try {
      await this.confirmationService.setupPasswordCode(normalizedEmail, user.id, ConfirmationTypes.PASSWORD_RESET);
    } catch (error: unknown) {
      this.logger.warn(`Password reset code setup failed for userId=${user.id}: ${String(error)}`);
      return false;
    }

    return true;
  }

  async resendRegistrationCode(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (!user || user.lockedAt || user.isRegistered) return false;

    try {
      await this.confirmationService.setupPasswordCode(normalizedEmail, user.id, ConfirmationTypes.REGISTRATION);
    } catch (error: unknown) {
      this.logger.warn(`Registration code resend failed for userId=${user.id}: ${String(error)}`);
    }
    return true;
  }

  async resetPassword(user: UserProfileDto, data: UserSetupPasswordDto): Promise<void> {
    const { newPassword, confirmNewPassword } = data;
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Новий пароль та підтвердження не співпадають');
    }
    // Revoke all existing passwords
    const existingPasswords = await this.userPasswordRepository.find({
      where: { user: { id: user.id }, revokedAt: IsNull() },
    });
    const revokedAt = new Date();
    for (const pw of existingPasswords) {
      pw.revokedAt = revokedAt;
    }
    if (existingPasswords.length > 0) {
      await this.userPasswordRepository.save(existingPasswords);
    }
    // Hash and save new password
    const passwordHash = await this.securityService.hash(newPassword);
    await this.userPasswordRepository.save({
      user: { id: user.id },
      passwordHash,
    });
    // Consume the reset token
    await this.confirmationService.consumeToken(user.id);

    await this.revokeAllSessions(user.id);
  }
}
