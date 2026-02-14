import { LoggingTypes } from 'src/common/enums/logging-types';

export type BaseLogsParams = {
  name: string;
  level: number;
  hostname: string;
  msg: string;
  pid: number;
  time: number | string; // Pino can be configured to send ISO string or epoch
  src?: {
    file: string;
    line: number;
    func: string;
  };
};

export type CustomLogsParams = {
  name?: string;
  userId?: string;
  statusCode?: number;
  path?: string;
  stack?: Record<string, unknown>;
  data?: Record<string, unknown>;
  type?: LoggingTypes;
};

export type SystemLogsParams = BaseLogsParams & CustomLogsParams;
