import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import DeviceDetector, { type DetectResult } from 'node-device-detector';
import { AuthRequest } from 'src/common/types/auth-request';

@Injectable()
export class DeviceInfoMiddleware implements NestMiddleware {
  private readonly detector = new DeviceDetector({
    clientIndexes: true,
    deviceIndexes: true,
    osIndexes: true,
    deviceAliasCode: false,
    deviceTrusted: false,
    deviceInfo: false,
    maxUserAgentSize: 500,
  });

  // Small in-memory cache to avoid re-detecting the same user agent for every request.
  private readonly deviceInfoCache = new Map<string, { value: DetectResult; expiresAt: number }>();
  private readonly cacheTtlMs = Number(process.env.DEVICE_DETECTOR_CACHE_TTL_MS ?? 5 * 60 * 1000);

  private getClientIp(req: AuthRequest) {
    const xf = (req.headers['x-forwarded-for'] as string) || '';
    const firstHop = xf.split(',')[0]?.trim();
    return firstHop || req.ip;
  }

  use(req: AuthRequest, _res: Response, next: NextFunction): void {
    const userAgent = (req.headers['user-agent'] as string) || '';
    const now = Date.now();

    const cached = this.deviceInfoCache.get(userAgent);
    if (cached && cached.expiresAt > now) {
      req.metadata = {
        userAgent,
        deviceInfo: cached.value,
        ipAddress: this.getClientIp(req),
      };
      next();
      return;
    }

    // Expired/missing cache entry.
    if (cached) this.deviceInfoCache.delete(userAgent);

    const deviceInfo = this.detector.detect(userAgent);

    // Lazy cache cleanup: if it grows too large, drop one oldest entry.
    if (this.deviceInfoCache.size > 2000) {
      const firstKey = this.deviceInfoCache.keys().next().value as string | undefined;
      if (firstKey) this.deviceInfoCache.delete(firstKey);
    }

    this.deviceInfoCache.set(userAgent, { value: deviceInfo, expiresAt: now + this.cacheTtlMs });

    req.metadata = {
      userAgent,
      deviceInfo,
      ipAddress: this.getClientIp(req),
    };

    next();
  }
}
