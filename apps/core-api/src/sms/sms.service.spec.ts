import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { SmsService } from './sms.service';
import { TwilioSmsProvider } from './twilio-sms-provider.service';

describe('SmsService', () => {
  let service: SmsService;
  let configService: ConfigService;
  let provider: TwilioSmsProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: TwilioSmsProvider,
          useValue: {
            sendSms: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    configService = module.get<ConfigService>(ConfigService);
    provider = module.get<TwilioSmsProvider>(TwilioSmsProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not send SMS if SMS_ENABLED is false', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(false);
    await service.sendSms('123456', 'test');
    expect(provider.sendSms).not.toHaveBeenCalled();
  });

  it('should send SMS if SMS_ENABLED is true and phone is provided', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(true);
    await service.sendSms('123456', 'test');
    expect(provider.sendSms).toHaveBeenCalledWith('123456', 'test');
  });

  it('should not send SMS if phone is missing', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(true);
    await service.sendSms('', 'test');
    expect(provider.sendSms).not.toHaveBeenCalled();
  });
});
