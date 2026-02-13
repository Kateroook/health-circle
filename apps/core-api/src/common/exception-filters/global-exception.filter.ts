import { ArgumentsHost, Catch, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Bunyan } from 'nestjs-bunyan';
import { CustomLogsParams } from 'src/logging/logging.types';

import { LoggingTypes } from '../enums/logging-types';

@Injectable()
@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  constructor(
    readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Bunyan,
  ) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException) super.catch(exception, host);
    else {
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();

      const isError = exception instanceof Error;
      const message = isError ? exception.message : (exception as Record<string, unknown>).message || 'Unknown error';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      const response = (exception as { response?: { data?: any } })?.response;
      const data: CustomLogsParams = {
        statusCode,
        type: (exception as { type?: LoggingTypes })?.type || LoggingTypes.other,
        data: (exception as { data?: any })?.data || response?.data,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        userId: request?.user?.id,
        path: httpAdapter.getRequestUrl(request),
        stack: isError ? { stack: exception.stack } : { message },
      };
      // Extend logs with exception data
      console.error('Unhandled exception', { ...data, message });
      this.logger.error(data, message as string);
      // Send modified response
      httpAdapter.reply(ctx.getResponse(), { statusCode, message }, statusCode);
    }
  }
}
