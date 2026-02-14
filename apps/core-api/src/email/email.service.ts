import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { compile, TemplateDelegate } from 'handlebars';
import { Bunyan } from 'nestjs-bunyan';
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
    private readonly logger: Bunyan,
  ) {
    this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));
    
    this.fromEmail = this.configService.getOrThrow<string>('EMAIL_FROM');

    this.registrationTemplate = this.loadTemplate('registration.hbs');
    // this.changePasswordTemplate = this.loadTemplate('change-password.hbs');
  }

  private loadTemplate(templateName: string): TemplateDelegate {
    const templatePath = resolve(__dirname, '..', 'common', 'assets', 'templates', templateName);

    if (!existsSync(templatePath)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (this.logger as any).error({ type: LoggingTypes.generateMail, templatePath }, 'Email template not found');
      throw new Error(`Template not found: ${templateName}`);
    }

    const templateSource = readFileSync(templatePath, 'utf8');
    return compile(templateSource);
  }

  public async registration(to: string, context: RegistrationContext) {
    const html = this.registrationTemplate(context);

    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Ваш обліковий запис успішно створено',
      html,
    });

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (this.logger as any).error(
        { to, error: error as unknown as Error, type: LoggingTypes.sendMail },
        'Failed to send registration confirmation email via Resend',
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.logger as any).info({ to, messageId: data?.id }, 'Registration email sent successfully');
  }

  public async changePassword(to: string, context: SetupPasswordContext) {
    const html = this.changePasswordTemplate(context);

    const { data, error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Зміна пароля до вашого облікового запису',
      html,
    });

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (this.logger as any).error(
        { to, error: error as unknown as Error, type: LoggingTypes.sendMail },
        'Failed to send setup password email via Resend',
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.logger as any).info({ to, messageId: data?.id }, 'Password change email sent successfully');
  }
}