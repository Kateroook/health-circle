import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthStrategies } from '../enums/auth-strategies';
import { AuthRequest } from '../types/auth-request';

export class UserJwtAccessGuard extends AuthGuard(AuthStrategies.userJwtAccess.toString()) implements CanActivate {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!request.user) throw new UnauthorizedException('Неавторизований запит');
    return true;
  }
}
