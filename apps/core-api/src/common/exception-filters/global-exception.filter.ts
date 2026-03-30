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
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const responseRef = ctx.getResponse();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] })?.message ?? exception.message ?? 'HttpException');

      const data: CustomLogsParams = {
        statusCode,
        type: (exception as { type?: LoggingTypes })?.type || LoggingTypes.other,
        data: (exceptionResponse as { data?: Record<string, unknown> })?.data,
        userId: (request as unknown as { user?: { id?: string } })?.user?.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        path: httpAdapter.getRequestUrl(request),
      };

      const msgText = Array.isArray(message) ? message.join(', ') : message;
      if (statusCode >= 500) this.logger.error(data, msgText);
      else this.logger.warn(data, msgText);

      super.catch(exception, host);
      return;
    }

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

    this.logger.error(data, message);
    // Send modified response
    httpAdapter.reply(responseRef, { statusCode, message }, statusCode);
  }
}
