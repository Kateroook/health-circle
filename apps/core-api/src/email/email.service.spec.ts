/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';
import { Resend } from 'resend';
import { LoggingTypes } from 'src/common/enums/logging-types';

import { EmailService } from './email.service';

jest.mock('fs');
jest.mock('handlebars');
jest.mock('resend');

import * as fs from 'fs';
import * as handlebars from 'handlebars';

describe('EmailService', () => {
  let service: EmailService;
  let logger: jest.Mocked<PinoLogger>;
  let mockResend: jest.Mocked<Resend>;
  let mockTemplateDelegate: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('<html>template</html>');

    mockTemplateDelegate = jest.fn().mockReturnValue('<h1>Compiled HTML</h1>');
    (handlebars.compile as jest.Mock).mockReturnValue(mockTemplateDelegate);

    const mockEmails = {
      send: jest.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null }),
    };

    // Mock Resend constructor
    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: mockEmails,
    }));

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'RESEND_API_KEY') return 're_123';
        if (key === 'EMAIL_FROM') return 'test@example.com';
        return 'test-value';
      }),
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getLoggerToken(EmailService.name), useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    logger = module.get(getLoggerToken(EmailService.name));

    // Access the mocked instance of Resend
    mockResend = (service as any).resend;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(Resend).toHaveBeenCalledWith('re_123');
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
          { provide: getLoggerToken(EmailService.name), useValue: mockLogger },
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

    it('should compile template and send email via Resend', async () => {
      await service.registration(to, context);

      expect(mockTemplateDelegate).toHaveBeenCalledWith(context);
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@example.com',
        to,
        subject: 'Ваш обліковий запис успішно створено',
        html: '<h1>Compiled HTML</h1>',
      });
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ to, messageId: 'msg_123' }),
        'Registration email sent successfully',
      );
    });

    it('should skip sending if email is a test email', async () => {
      const testEmail = 'test1234567890@gmail.com';
      await service.registration(testEmail, context);

      expect(mockResend.emails.send).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ to: testEmail }), 'Skipping test email sending');
    });

    it('should log error if sending fails', async () => {
      const error = new Error('Resend Error');
      (mockResend.emails.send as jest.Mock).mockResolvedValueOnce({ data: null, error: error });

      await service.registration(to, context);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ to, error, type: LoggingTypes.sendMail }),
        'Failed to send registration confirmation email via Resend',
      );
    });
  });

  describe('changePassword', () => {
    const to = 'test@example.com';
    const context = { name: 'User', link: 'http://...' } as any;

    it('should compile template and send email via Resend', async () => {
      if (!service['changePasswordTemplate']) {
        service['changePasswordTemplate'] = mockTemplateDelegate;
      }

      await service.changePassword(to, context);

      expect(mockTemplateDelegate).toHaveBeenCalledWith(context);
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'test@example.com',
        to,
        subject: 'Зміна пароля до вашого облікового запису',
        html: '<h1>Compiled HTML</h1>',
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ to, messageId: 'msg_123' }),
        'Password change email sent successfully',
      );
    });

    it('should skip sending if email is a test email', async () => {
      const testEmail = 'test1234567890@gmail.com';
      await service.changePassword(testEmail, context);

      expect(mockResend.emails.send).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ to: testEmail }), 'Skipping test email sending');
    });

    it('should log error if sending fails', async () => {
      if (!service['changePasswordTemplate']) {
        service['changePasswordTemplate'] = mockTemplateDelegate;
      }

      const error = new Error('Resend Error');
      (mockResend.emails.send as jest.Mock).mockResolvedValueOnce({ data: null, error: error });

      await service.changePassword(to, context);

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ to, error, type: LoggingTypes.sendMail }),
        'Failed to send setup password email via Resend',
      );
    });
  });
});
