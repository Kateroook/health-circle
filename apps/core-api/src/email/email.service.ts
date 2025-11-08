/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { compile, TemplateDelegate } from 'handlebars';
import { Bunyan } from 'nestjs-bunyan';
import { createTransport, Transporter } from 'nodemailer';
import { resolve } from 'path';
import { LoggingTypes } from 'src/common/enums/logging-types';

import { RegistrationContext, SetupPasswordContext } from './email.types';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private registrationTemplate: TemplateDelegate;
  private changePasswordTemplate: TemplateDelegate;
  private contactFormTemplate: TemplateDelegate;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Bunyan,
  ) {
    this.transporter = createTransport({
      host: this.configService.getOrThrow<string>('EMAIL_HOST'),
      port: this.configService.getOrThrow<number>('EMAIL_PORT'),
      secure: this.configService.getOrThrow<number>('EMAIL_PORT') === 465, // auto-secure for 465
      auth: {
        user: this.configService.getOrThrow<string>('EMAIL_USER'),
        pass: this.configService.getOrThrow<string>('EMAIL_PASS'),
      },
    });
    this.registrationTemplate = this.loadTemplate('registration.hbs');
    // this.changePasswordTemplate = this.loadTemplate('change-password.hbs');
    // this.contactFormTemplate = this.loadTemplate('contact-form.hbs');
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

  public async registration(to: string, context: RegistrationContext) {
    const html = this.registrationTemplate(context);

    try {
      await this.transporter.sendMail({
        to,
        from: this.configService.getOrThrow<string>('EMAIL_USER'),
        subject: 'Ваш обліковий запис успішно створено',
        html,
      });
    } catch (error: unknown) {
      this.logger.error({ to, error, type: LoggingTypes.sendMail }, 'Failed to send registration confirmation email');
    }
  }

  public async changePassword(to: string, context: SetupPasswordContext) {
    const html = this.changePasswordTemplate(context);

    try {
      await this.transporter.sendMail({
        to,
        from: this.configService.getOrThrow<string>('EMAIL_USER'),
        subject: 'Зміна пароля до вашого облікового запису',
        html,
      });
    } catch (error: unknown) {
      this.logger.error({ to, error, type: LoggingTypes.sendMail }, 'Failed to send setup password email');
    }
  }
}
