import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Bunyan } from 'nestjs-bunyan';
import { LoggingTypes } from 'src/common/enums/logging-types';

import { EmailService } from './email.service';

jest.mock('fs');
jest.mock('nodemailer');
jest.mock('handlebars');

import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';

describe('EmailService', () => {
  let service: EmailService;
  let logger: jest.Mocked<Bunyan>;
  let configService: jest.Mocked<ConfigService>;
  let mockTransporter: { sendMail: jest.Mock };
  let mockTemplateDelegate: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('<html>template</html>');

    mockTemplateDelegate = jest.fn().mockReturnValue('<h1>Compiled HTML</h1>');
    (handlebars.compile as jest.Mock).mockReturnValue(mockTemplateDelegate);

    mockTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'EMAIL_PORT') return 587;
        return 'test-value';
      }),
    };

    const mockLogger = { error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Bunyan, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    logger = module.get(Bunyan);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'test-value',
        port: 587,
        auth: { user: 'test-value', pass: 'test-value' },
      }),
    );
  });

  describe('constructor / loadTemplate', () => {
    it('should throw error if template does not exist', async () => {
      jest.resetModules();
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const mockLogger = { error: jest.fn() };

      const promise = Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('x') } },
          { provide: Bunyan, useValue: mockLogger },
        ],
      }).compile();

      await expect(promise).rejects.toThrow(/Template not found/);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ type: LoggingTypes.generateMail }),
        expect.stringContaining('Email template not found'),
      );
    });
  });

  describe('registration', () => {
    const to = 'test@example.com';
    const context = { name: 'User', link: 'http://...' } as any;

    it('should compile template and send email', async () => {
      await service.registration(to, context);

      expect(mockTemplateDelegate).toHaveBeenCalledWith(context);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to,
        from: 'test-value',
        subject: 'Ваш обліковий запис успішно створено',
        html: '<h1>Compiled HTML</h1>',
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log error if sending fails', async () => {
      const error = new Error('SMTP Error');
      mockTransporter.sendMail.mockRejectedValueOnce(error);

      await service.registration(to, context);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ to, error, type: LoggingTypes.sendMail }),
        'Failed to send registration confirmation email',
      );
    });
  });

  describe('changePassword', () => {
    const to = 'test@example.com';
    const context = { name: 'User', link: 'http://...' } as any;

    it('should compile template and send email', async () => {
      if (!service['changePasswordTemplate']) {
        service['changePasswordTemplate'] = mockTemplateDelegate;
      }

      await service.changePassword(to, context);

      expect(mockTemplateDelegate).toHaveBeenCalledWith(context);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: 'Зміна пароля до вашого облікового запису',
          html: '<h1>Compiled HTML</h1>',
        }),
      );
    });

    it('should log error if sending fails', async () => {
      if (!service['changePasswordTemplate']) {
        service['changePasswordTemplate'] = mockTemplateDelegate;
      }

      const error = new Error('SMTP Error');
      mockTransporter.sendMail.mockRejectedValueOnce(error);

      await service.changePassword(to, context);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ to, error, type: LoggingTypes.sendMail }),
        'Failed to send setup password email',
      );
    });
  });
});
