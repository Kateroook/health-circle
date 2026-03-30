import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';

import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const makeHost = () =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'u1' } }),
        getResponse: () => ({}),
      }),
    }) as any;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs warn for 4xx HttpException and continues', () => {
    const logger = { warn: jest.fn(), error: jest.fn() } as any;
    const httpAdapterHost = { httpAdapter: { getRequestUrl: () => '/path' } } as unknown as HttpAdapterHost;
    const superCatchSpy = jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation(() => undefined as unknown as void);

    const filter = new GlobalExceptionFilter(httpAdapterHost, logger);
    filter.catch(new BadRequestException('bad'), makeHost());

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
    expect(superCatchSpy).toHaveBeenCalledTimes(1);
  });

  it('logs error for 5xx HttpException and continues', () => {
    const logger = { warn: jest.fn(), error: jest.fn() } as any;
    const httpAdapterHost = { httpAdapter: { getRequestUrl: () => '/path' } } as unknown as HttpAdapterHost;
    const superCatchSpy = jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation(() => undefined as unknown as void);

    const filter = new GlobalExceptionFilter(httpAdapterHost, logger);
    filter.catch(new InternalServerErrorException('boom'), makeHost());

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(superCatchSpy).toHaveBeenCalledTimes(1);
  });
});
