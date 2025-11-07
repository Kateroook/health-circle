import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserEntity } from 'src/common/entities/user.entity';
import { EmailService } from 'src/email/email.service';
import { IsNull, Repository } from 'typeorm';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SecurityService } from '../../security/security.service';
import { SetupPasswordConfirmationDto } from './dto/setup-password-confirmation.dto';
import { ConfirmationTypes } from './enums/confirmation-type';
import { SetupPasswordReasons } from './enums/setup-password-reasons';

@Injectable()
export class ConfirmationsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly securityService: SecurityService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async setupPasswordCode(email: string, userId: string, reason: SetupPasswordReasons): Promise<string> {
    const token = await this.generateCode(userId, ConfirmationTypes.setupPassword, reason);

    const link = `${this.configService.get<string>('SETUP_PASSWORD_URL')}?email=${email}&token=${token}&reason=${reason}`;

    switch (reason) {
      case SetupPasswordReasons.setup:
        await this.emailService.registration(email, { link, year: new Date().getFullYear() });
        break;
      case SetupPasswordReasons.reset:
        await this.emailService.changePassword(email, { link, year: new Date().getFullYear() });
    }

    return link;
  }

  private getSetupPasswordTtl(reason: SetupPasswordReasons): number {
    switch (reason) {
      case SetupPasswordReasons.reset:
        return this.configService.get<number>('RESET_PASSWORD_TOKEN_TTL')!;
      case SetupPasswordReasons.setup:
        return this.configService.get<number>('SETUP_PASSWORD_TOKEN_TTL')!;
      case SetupPasswordReasons.expire:
        return this.configService.get<number>('EXPIRE_PASSWORD_TOKEN_TTL')!;
    }
  }

  private async generateCode(userId: string, type: ConfirmationTypes, reason: SetupPasswordReasons): Promise<string> {
    const code = this.securityService.getConfirmCode();
    const key = `${type}:${userId}`;

    await this.cacheManager.set(key, { code, reason }, this.getSetupPasswordTtl(reason) * 1000);
    return code;
  }

  async verifyToken(type: ConfirmationTypes, email: string, token: string) {
    const user = await this.usersRepository.findOne({
      where: { email, lockedAt: IsNull() },
    });
    if (!user) throw new UnauthorizedException('Невірні облікові дані');

    const key = `${type}:${user.id}`;
    const data = await this.cacheManager.get<SetupPasswordConfirmationDto>(key);
    if (data?.token !== token) throw new UnauthorizedException('Недійсний або прострочений токен');

    return new UserProfileDto(user);
  }

  async consumeToken(type: ConfirmationTypes, userId: string): Promise<void> {
    await this.cacheManager.del(`${type}:${userId}`);
  }
}
