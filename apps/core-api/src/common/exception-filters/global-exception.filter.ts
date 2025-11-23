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

  catch(exception: any, host: ArgumentsHost): void {
    if (exception instanceof HttpException) super.catch(exception, host);
    else {
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();

      const message = Object.keys(exception).length === 0 ? exception.toString() : exception.message || 'Unknown error';
      const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

      const data: CustomLogsParams = {
        statusCode,
        type: exception.type || LoggingTypes.other,
        data: exception.data || exception.response?.data,
        userId: request?.user?.id,
        path: httpAdapter.getRequestUrl(request),
        stack: Object.keys(exception).length > 0 ? (exception.stack ?? exception) : { message },
      };
      // Extend logs with exception data
      console.error('Unhandled exception', { ...data, message });
      this.logger.error(data, message);
      // Send modified response
      httpAdapter.reply(ctx.getResponse(), { statusCode, message }, statusCode);
    }
  }
}
