import { DetectResult } from 'node-device-detector';

export type RequestMetadata = {
  deviceInfo: DetectResult;
  ipAddress?: string;
  userAgent: string;
};
