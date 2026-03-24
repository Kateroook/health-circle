import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { getOptionsToken, getStorageToken, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken())
    options: ThrottlerModuleOptions,
    @Inject(getStorageToken())
    storageService: ThrottlerStorage,
    @Inject(Reflector)
    reflector: Reflector,
    private configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.configService.get('THROTTLER_ENABLED') === 'false') {
      return true;
    }
    return super.canActivate(context);
  }

  protected getTracker(req: Request): Promise<string> {
    // 1. Try to use authenticated user ID
    const user = req.user as { id?: string };
    if (user && user.id) {
      return Promise.resolve(user.id);
    }

    // 2. Try to use email from body (for login/registration/forgot password)
    const body = req.body as { email?: string };
    if (body && body.email) {
      return Promise.resolve(body.email);
    }

    // 3. Fallback to IP address
    const ip =
      req.ip || (Array.isArray(req.ips) && req.ips.length ? req.ips[0] : undefined) || req.socket?.remoteAddress || 'unknown';
    return Promise.resolve(ip);
  }
}
