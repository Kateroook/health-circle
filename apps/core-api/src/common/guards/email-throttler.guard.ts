import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class EmailThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const body = req.body as { email?: string };
    if (body && body.email) {
      return Promise.resolve(body.email);
    }
    return Promise.resolve(req.ips.length ? req.ips[0] : req.ip || 'unknown'); // Fallback to IP
  }
}
