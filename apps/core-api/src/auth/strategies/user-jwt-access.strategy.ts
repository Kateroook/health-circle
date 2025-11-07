import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { AuthStrategies } from 'src/common/enums/auth-strategies';

import { AuthRequest } from 'src/common/types/auth-request';
import { AuthService } from '../auth.service';
import { UserTokenPayload } from '../types/user-token-payload';

@Injectable()
export class UserJwtAccessStrategy extends PassportStrategy(Strategy, AuthStrategies.userJwtAccess.toString()) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      passReqToCallback: true,
      jwtFromRequest: ExtractJwt.fromExtractors([UserJwtAccessStrategy.ExtractJwtFromCookies]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
      algorithms: ['HS256'],
    } as StrategyOptionsWithRequest);
  }

  async validate(req: AuthRequest, payload: UserTokenPayload): Promise<UserProfileDto> {
    return this.authService.verifyUser(payload, req.metadata);
  }

  private static ExtractJwtFromCookies(this: void, req: Request): string {
    const cookies = req.cookies as Record<string, string>;
    return cookies.AccessToken;
  }
}
