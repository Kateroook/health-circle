import { Test, TestingModule } from '@nestjs/testing';

import { ConfirmationsController } from './confirmations.controller';

describe('ConfirmationsController', () => {
  let controller: ConfirmationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfirmationsController],
    }).compile();

    controller = module.get<ConfirmationsController>(ConfirmationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
