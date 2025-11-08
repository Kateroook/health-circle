import { LoggingTypes } from 'src/common/enums/logging-types';

export type BanyanLogsParams = {
  name: string;
  level: number;
  hostname: string;
  msg: string;
  pid: number;
  time: Date;
  src: {
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
  stack?: object;
  data?: object;
  type?: LoggingTypes;
};

export type SystemLogsParams = BanyanLogsParams & CustomLogsParams;
