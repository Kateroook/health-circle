import type { RawBodyRequest } from '@nestjs/common';
import { Body, Controller, Headers, HttpCode, Logger, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Request } from 'express';
import { UserStatus } from 'src/common/enums/user-status';
import { UsersService } from 'src/users/users.service';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Twilio inbound SMS webhook.
   * Called by Twilio when someone texts our Twilio number.
   * No JWT auth — validated via Twilio HMAC-SHA1 signature instead.
   */
  @Post('inbound')
  @HttpCode(200)
  @ApiOperation({ summary: 'Twilio inbound SMS webhook' })
  async handleInbound(
    @Headers('x-twilio-signature') twilioSignature: string,
    @Body() body: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<string> {
    // Validate Twilio signature
    if (!this.validateTwilioSignature(twilioSignature, req, body)) {
      this.logger.warn('Invalid Twilio signature on inbound SMS');
      return '<Response/>';
    }

    const rawText = (body.Body ?? '').trim().toUpperCase();
    // Extract the first token — that's the code (format: HC-XXXXXXXXXX or HC-XXXXXXXXXX SAFE/DANGER)
    const [codeToken, statusToken] = rawText.split(/\s+/);

    if (!codeToken?.startsWith('HC-')) {
      this.logger.debug(`Inbound SMS ignored — no HC- prefix: "${rawText}"`);
      return '<Response/>';
    }

    const user = await this.usersService.findBySmsCode(codeToken);
    if (!user) {
      this.logger.warn(`Inbound SMS with unknown code: ${codeToken}`);
      return '<Response/>';
    }

    // Determine status: default SAFE, override with keyword if provided
    let status = UserStatus.SAFE;
    if (statusToken === 'DANGER') status = UserStatus.DANGER;
    else if (statusToken === 'WAS_SAFE') status = UserStatus.WAS_SAFE;

    this.logger.log(`Inbound SMS status update: userId=${user.id} status=${status}`);
    await this.usersService.updateStatus(user.id, status);

    // Empty TwiML response — tells Twilio delivery is confirmed, no SMS reply
    return '<Response/>';
  }

  private validateTwilioSignature(signature: string, req: RawBodyRequest<Request>, body: Record<string, string>): boolean {
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '');

    // In dev with SMS disabled, skip validation
    const smsEnabled = this.configService.get<boolean>('SMS_ENABLED', false);
    if (!smsEnabled) return true;

    if (!signature || !authToken) return false;

    // Reconstruct the full URL Twilio signed
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // Twilio signature: HMAC-SHA1 of (url + sorted params concatenated)
    const sortedParams = Object.keys(body)
      .sort()
      .reduce((acc, key) => acc + key + body[key], url);

    const expected = crypto.createHmac('sha1', authToken).update(sortedParams).digest('base64');

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}
