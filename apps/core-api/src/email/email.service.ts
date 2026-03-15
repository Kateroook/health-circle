import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { compile, TemplateDelegate } from 'handlebars';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { resolve } from 'path';
import { Resend } from 'resend';
import { LoggingTypes } from 'src/common/enums/logging-types';

import { RegistrationContext, SetupPasswordContext } from './email.types';

@Injectable()
export class EmailService {
  private resend: Resend;
  private registrationTemplate: TemplateDelegate;
  private changePasswordTemplate: TemplateDelegate;
  private fromEmail: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(EmailService.name)
    private readonly logger: PinoLogger,
  ) {
    this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));

    this.fromEmail = this.configService.getOrThrow<string>('EMAIL_FROM');

    this.registrationTemplate = this.loadTemplate('registration.hbs');
    this.changePasswordTemplate = this.loadTemplate('change-password.hbs');
  }

  private loadTemplate(templateName: string): TemplateDelegate {
    const templatePath = resolve(__dirname, '..', 'common', 'assets', 'templates', templateName);

    if (!existsSync(templatePath)) {
      this.logger.error({ type: LoggingTypes.generateMail, templatePath }, 'Email template not found');
      throw new Error(`Template not found: ${templateName}`);
    }

    const templateSource = readFileSync(templatePath, 'utf8');
    return compile(templateSource);
  }

  private isTestEmail(email: string): boolean {
    const testEmailRegex = /^test[A-Za-z0-9_-]{10}@gmail\.com$/;
    return testEmailRegex.test(email);
  }

  public async registration(to: string, context: RegistrationContext) {
    if (this.isTestEmail(to)) {
      this.logger.info({ to, type: LoggingTypes.sendMail }, 'Skipping test email sending');
      return;
    }

    const html = this.registrationTemplate(context);

    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Ваш обліковий запис успішно створено',
      html,
    });

    if (error) {
      this.logger.error(
        { to, error: error as unknown as Error, type: LoggingTypes.sendMail },
        'Failed to send registration confirmation email via Resend',
      );
      return;
    }

    this.logger.info({ to, messageId: data?.id }, 'Registration email sent successfully');
  }

  public async changePassword(to: string, context: SetupPasswordContext) {
    if (this.isTestEmail(to)) {
      this.logger.info({ to, type: LoggingTypes.sendMail }, 'Skipping test email sending');
      return;
    }

    const html = this.changePasswordTemplate(context);

    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Зміна пароля до вашого облікового запису',
      html,
    });

    if (error) {
      this.logger.error(
        { to, error: error as unknown as Error, type: LoggingTypes.sendMail },
        'Failed to send setup password email via Resend',
      );
      return;
    }

    this.logger.info({ to, messageId: data?.id }, 'Password change email sent successfully');
  }
}
