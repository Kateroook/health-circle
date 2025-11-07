import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { AuthStrategies } from 'src/common/enums/auth-strategies';

import { AuthService } from '../auth.service';
import { UserTokenPayload } from '../types/user-token-payload';

@Injectable()
export class UserJwtRefreshStrategy extends PassportStrategy(Strategy, AuthStrategies.userJwtRefresh.toString()) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      passReqToCallback: true,
      jwtFromRequest: ExtractJwt.fromExtractors([UserJwtRefreshStrategy.ExtractJwtFromCookies]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      algorithms: ['HS256'],
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: UserTokenPayload): Promise<UserProfileDto> {
    return this.authService.verifySession(UserJwtRefreshStrategy.ExtractJwtFromCookies(req), payload);
  }

  private static ExtractJwtFromCookies(this: void, req: Request): string {
    const cookies = req.cookies as Record<string, string>;
    return cookies.RefreshToken;
  }
}
