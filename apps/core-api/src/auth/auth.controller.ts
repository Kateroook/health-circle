import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { instanceToPlain } from 'class-transformer';
import type { Response } from 'express';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { ConfirmationsService } from 'src/confirmations/confirmations.service';

import { AuthStrategies } from '../common/enums/auth-strategies';
import { ConfirmationRegistrationGuard } from '../common/guards/confirmation.guard';
import { ConfirmationPasswordResetGuard } from '../common/guards/confirmation-password-reset.guard';
import { UserJwtAccessGuard } from '../common/guards/user-jwt-access.guard';
import { UserJwtRefreshGuard } from '../common/guards/user-jwt-refresh.guard';
import { UserLocalGuard } from '../common/guards/user-local.guard';
import type { AuthRequest } from '../common/types/auth-request';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { SetupPasswordDto } from './dto/token-query.dto';
import { UserChangePasswordDto } from './dto/user-change-password.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserSetupPasswordDto } from './dto/user-setup-password.dto';

@ApiTags('Auth API')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    protected readonly confirmationsService: ConfirmationsService,
  ) {}

  @Post('login')
  @UseGuards(UserLocalGuard)
  @Throttle({ long: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: UserLoginDto })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: 'Returns access and refresh tokens in the Cookies or OAuth2 redirect link',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user, req.metadata, res);
  }

  @Post('logout')
  @UseGuards(UserJwtAccessGuard)
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @ApiOperation({ summary: 'User logout and revoked user session' })
  @ApiOkResponse({ description: 'Logs out the user and clears auth cookie' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  logout(@Req() req: AuthRequest) {
    return this.authService.logout(req.user, req.metadata);
  }

  @Post('refresh')
  @UseGuards(UserJwtRefreshGuard)
  @ApiBearerAuth(AuthStrategies.userJwtRefresh)
  @ApiOperation({ summary: 'Refresh user access token' })
  @ApiOkResponse({ description: 'Returns new access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async refresh(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req.user, req.metadata, res);
  }

  @Post('password-setup')
  @UseGuards(ConfirmationRegistrationGuard)
  @Throttle({ long: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Setup new password' })
  async setupPassword(@Query() query: SetupPasswordDto, @Body() body: UserSetupPasswordDto, @Req() req: AuthRequest) {
    return this.authService.setupPassword(req.user, body);
  }

  @Get('profile')
  @UseGuards(UserJwtAccessGuard)
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiOkResponse({ description: 'Returns user profile', type: UserProfileDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getProfile(@Req() req: AuthRequest) {
    return instanceToPlain(req.user);
  }

  @Post('change-password')
  @UseGuards(UserJwtAccessGuard)
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @ApiOperation({ summary: 'Change user password (authenticated)' })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid old password' })
  async changePassword(@Body() body: UserChangePasswordDto, @Req() req: AuthRequest) {
    await this.authService.changePassword(req.user, body);
    return { success: true, message: 'Пароль успішно змінено' };
  }

  @Post('forgot-password')
  @Throttle({ long: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request password reset code via email' })
  @ApiOkResponse({ description: 'If the email exists, a reset code will be sent' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body.email);
    return { success: true, message: 'Код для скидання паролю надіслано на вашу пошту' };
  }

  @Post('resend-registration-code')
  @Throttle({ long: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend registration confirmation code' })
  @ApiOkResponse({ description: 'New registration code sent' })
  async resendRegistrationCode(@Body() body: { email: string }) {
    await this.authService.resendRegistrationCode(body.email);
    return { success: true, message: 'Код підтвердження надіслано повторно' };
  }

  @Post('reset-password')
  @UseGuards(ConfirmationPasswordResetGuard)
  @ApiOperation({ summary: 'Reset password using confirmation code' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(@Query() query: SetupPasswordDto, @Body() body: UserSetupPasswordDto, @Req() req: AuthRequest) {
    await this.authService.resetPassword(req.user, body);
    return { success: true, message: 'Пароль успішно скинуто' };
  }
}
