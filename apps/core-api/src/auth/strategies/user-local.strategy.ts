import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { AuthStrategies } from 'src/common/enums/auth-strategies';

import { AuthService } from '../auth.service';

@Injectable()
export class UserLocalStrategy extends PassportStrategy(Strategy, AuthStrategies.userLocal.toString()) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<UserProfileDto> {
    return await this.authService.validateUser(email, password);
  }
}
