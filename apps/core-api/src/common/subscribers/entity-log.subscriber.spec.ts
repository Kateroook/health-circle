import { Logger as NestLogger } from '@nestjs/common';

import { LoggerSubscriber } from './entity-log.subscriber';

describe('LoggerSubscriber', () => {
  beforeEach(() => {
    jest.spyOn(NestLogger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not throw in afterInsert when entity is missing', async () => {
    const subscriber = new LoggerSubscriber();
    const save = jest.fn();

    const event = {
      metadata: { name: 'UserEntity', tableName: 'users' },
      manager: { getRepository: () => ({ save }) },
      entity: undefined,
    } as any;

    await expect(subscriber.afterInsert(event)).resolves.toBeUndefined();
    expect(save).not.toHaveBeenCalled();
  });

  it('swallows errors in afterInsert when audit save fails', async () => {
    const subscriber = new LoggerSubscriber();
    const save = jest.fn().mockRejectedValue(new Error('db down'));

    const event = {
      metadata: { name: 'UserEntity', tableName: 'users' },
      manager: { getRepository: () => ({ save }) },
      entity: { id: 'u1', code: 'USER1', updatedAt: new Date() },
    } as any;

    await expect(subscriber.afterInsert(event)).resolves.toBeUndefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(NestLogger.prototype.warn).toHaveBeenCalledTimes(1);
  });

  it('swallows errors in afterUpdate when audit save fails', async () => {
    const subscriber = new LoggerSubscriber();
    const save = jest.fn().mockRejectedValue(new Error('db down'));

    const event = {
      metadata: { name: 'UserEntity', tableName: 'users' },
      manager: { getRepository: () => ({ save }) },
      entity: { id: 1, code: 'USER1', updatedAt: new Date() },
      databaseEntity: { id: 1, code: 'USER1', updatedAt: new Date() },
      updatedColumns: [{ propertyName: 'code' }],
      updatedRelations: [],
    } as any;

    await expect(subscriber.afterUpdate(event)).resolves.toBeUndefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(NestLogger.prototype.warn).toHaveBeenCalledTimes(1);
  });
});
