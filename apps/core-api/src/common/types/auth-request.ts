import { Request } from 'express';

import { UserProfileDto } from '../dto/user-profile.dto';
import { RequestMetadata } from './request-metadata';

export type AuthRequest = Request & {
  user: UserProfileDto;
  metadata: RequestMetadata;
  cookies: { AccessToken: string; RefreshToken: string };
};
