import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';
import { ConfirmationTypes } from 'src/confirmations/enums/confirmation-type';

import { AuthRequest } from '../types/auth-request';

@Injectable()
export class ConfirmationPasswordResetGuard implements CanActivate {
  constructor(
    private readonly confirmationService: ConfirmationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const { code, email } = request.query;

    if (!code) throw new BadRequestException('Відсутній код');

    request.user = await this.confirmationService.verifyCode(ConfirmationTypes.PASSWORD_RESET, email as string, code as string);

    return true;
  }
}
