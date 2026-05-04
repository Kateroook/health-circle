import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check() {
    const result = await this.health.check([() => this.db.pingCheck('database')]);
    return { ...result, version: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA };
  }
}
