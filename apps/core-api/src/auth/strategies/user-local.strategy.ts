import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { AuthStrategies } from 'src/common/enums/auth-strategies';
import { AuthRequest } from 'src/common/types/auth-request';

import { AuthService } from '../auth.service';

@Injectable()
export class UserLocalStrategy extends PassportStrategy(Strategy, AuthStrategies.userLocal.toString()) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'identifier', passwordField: 'password', passReqToCallback: true });
  }

  async validate(req: AuthRequest, identifier: string, password: string): Promise<UserProfileDto> {
    return await this.authService.validateUser(identifier, password, req.metadata);
  }
}
