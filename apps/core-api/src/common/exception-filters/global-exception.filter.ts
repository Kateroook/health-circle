import { ArgumentsHost, Catch, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { CustomLogsParams } from 'src/logging/logging.types';

import { LoggingTypes } from '../enums/logging-types';

@Injectable()
@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  constructor(
    readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Logger,
  ) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException) super.catch(exception, host);
    else {
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const request = ctx.getRequest();

      const isError = exception instanceof Error;
      const message = isError ? exception.message : (exception as { message?: string })?.message || 'Unknown error';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      const response = (exception as { response?: { data?: Record<string, unknown> } })?.response;
      const data: CustomLogsParams = {
        statusCode,
        type: (exception as { type?: LoggingTypes })?.type || LoggingTypes.other,
         
        data: (exception as { data?: Record<string, unknown> })?.data || response?.data,
         
        userId: (request as unknown as { user?: { id?: string } })?.user?.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        path: httpAdapter.getRequestUrl(request),
        stack: isError ? { stack: exception.stack } : { message: message },
      };
      // Extend logs with exception data
      console.error('Unhandled exception', { ...data, message });
       
      this.logger.error(data, message);
      // Send modified response
      httpAdapter.reply(ctx.getResponse(), { statusCode, message }, statusCode);
    }
  }
}
