import { BadRequestException, CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';

import { ConfirmationTypes } from '../../confirmations/enums/confirmation-type';
import { AuthRequest } from '../types/auth-request';

export const ConfirmationType = (type: ConfirmationTypes) => SetMetadata('CONFIRMATION_TYPE', type.toString());

@Injectable()
export class ConfirmationGuard implements CanActivate {
  constructor(
    private readonly confirmationService: ConfirmationsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const { token, email } = request.query;
    const type = this.reflector.get<ConfirmationTypes>('CONFIRMATION_TYPE', context.getHandler());

    if (!type) throw new BadRequestException('Відсутній тип підтвердження');
    if (!token) throw new BadRequestException('Відсутній токен');

    request.user = await this.confirmationService.verifyToken(type, email as string, token as string);

    return true;
  }
}
