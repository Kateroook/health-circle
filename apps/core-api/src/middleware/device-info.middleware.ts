import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import DeviceDetector from 'node-device-detector';
import { AuthRequest } from 'src/common/types/auth-request';

@Injectable()
export class DeviceInfoMiddleware implements NestMiddleware {
  constructor() {}

  private getClientIp(req: AuthRequest) {
    const xf = (req.headers['x-forwarded-for'] as string) || '';
    const firstHop = xf.split(',')[0]?.trim();
    return firstHop || req.ip;
  }

  use(req: AuthRequest, _res: Response, next: NextFunction): void {
    const userAgent = (req.headers['user-agent'] as string) || '';

    const detector = new DeviceDetector({
      clientIndexes: true,
      deviceIndexes: true,
      osIndexes: true,
      deviceAliasCode: false,
      deviceTrusted: false,
      deviceInfo: false,
      maxUserAgentSize: 500,
    });

    req.metadata = {
      userAgent,
      deviceInfo: detector.detect(userAgent),
      ipAddress: this.getClientIp(req),
    };

    next();
  }
}
