import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthStrategies } from 'src/common/enums/auth-strategies';
import { UserJwtAccessGuard } from 'src/common/guards/user-jwt-access.guard';
import type { AuthRequest } from 'src/common/types/auth-request';

import { AlertsService } from './alerts.service';
import { MyAlertStatusDto } from './dto/my-alert-status.dto';

@ApiTags('Alerts API')
@ApiBearerAuth(AuthStrategies.userJwtAccess)
@UseGuards(UserJwtAccessGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get currently active alert UIDs' })
  getActiveAlerts() {
    return this.alertsService.getActiveAlerts();
  }

  @Post('trigger-sync')
  @ApiOperation({ summary: 'Manually trigger alert sync' })
  async triggerSync() {
    await this.alertsService.syncAlerts();
    return { message: 'Sync triggered' };
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get hierarchical list of regions' })
  getRegions() {
    return this.alertsService.getRegions();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current user alert status (for dashboard banner)' })
  @ApiOkResponse({ type: MyAlertStatusDto })
  getMyAlertStatus(@Req() req: AuthRequest) {
    return this.alertsService.getMyAlertStatus(req.user.id);
  }
}
