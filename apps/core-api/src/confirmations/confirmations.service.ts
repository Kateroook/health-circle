import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { UserEntity } from 'src/common/entities/user.entity';
import { EmailService } from 'src/email/email.service';
import { IsNull, Repository } from 'typeorm';

import { ConfirmationCodeEntity } from 'src/common/entities/confirmation-code.entity';
import { SecurityService } from '../security/security.service';
import { ConfirmationTypes } from './enums/confirmation-type';

@Injectable()
export class ConfirmationsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ConfirmationCodeEntity)
    private readonly codeRepository: Repository<ConfirmationCodeEntity>,
    private readonly securityService: SecurityService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async setupPasswordCode(email: string, userId: string, type: ConfirmationTypes): Promise<string> {
    const code = await this.generateCode(userId, type);

    switch (type) {
      case ConfirmationTypes.REGISTRATION:
        await this.emailService.registration(email, { code, year: new Date().getFullYear() });
        break;
      case ConfirmationTypes.PASSWORD_RESET:
        await this.emailService.changePassword(email, { code, year: new Date().getFullYear() });
        break
    }

    return code;
  }

  private getTTL(type: ConfirmationTypes): number {
    switch (type) {
      case ConfirmationTypes.PASSWORD_RESET:
        return this.configService.get<number>('RESET_PASSWORD_TOKEN_TTL')!;
      case ConfirmationTypes.REGISTRATION:
        return this.configService.get<number>('SETUP_PASSWORD_TOKEN_TTL')!;
      default: return 24*60*60; // 1 day
    }
  }

  private async generateCode(userId: string, type: ConfirmationTypes): Promise<string> {
    const code = this.securityService.getConfirmCode();
    const ttl = this.getTTL(type);
    await this.codeRepository.delete({ user: { id: userId }, type });
    await this.codeRepository.save({
      user: {id: userId},
      code,
      type,
      expiresAt: new Date(Date.now() + ttl * 1000),
    });
    return code;
  }

// todo: regenerate code if expired
async verifyCode(type: ConfirmationTypes, email: string, code: string) {
    const user = await this.usersRepository.findOne({ where: { email, lockedAt: IsNull() }});
    if (!user) throw new UnauthorizedException('Невірні облікові дані');
    const savedCode = await this.codeRepository.findOne({
      where: { user: {id: user.id}, type },
    });
    const isCodeValid = savedCode && savedCode.code === code && savedCode.expiresAt > new Date();
    if (!isCodeValid) throw new UnauthorizedException('Недійсний або прострочений токен'); 
    return new UserProfileDto(user);
  }

  async consumeToken(userId: string): Promise<void> {
    await this.codeRepository.delete({ user: { id: userId } });
  }
}
