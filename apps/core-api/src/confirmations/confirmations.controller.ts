import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { TokenQueryDto } from 'src/auth/dto/token-query.dto';

import { ConfirmationGuard, ConfirmationType } from '../common/guards/confirmation.guard';
import { ConfirmationTypes } from './enums/confirmation-type';

@ApiTags('Confirmations API')
@Controller('confirmations')
export class ConfirmationsController {
  @Get('validate/password-setup')
  @UseGuards(ConfirmationGuard)
  @ConfirmationType(ConfirmationTypes.setupPassword)
  @ApiOperation({ summary: 'Validate setup password code' })
  @ApiOkResponse({ description: 'Returns 200 OK' })
  validateConfirmation(@Query() query: TokenQueryDto, @Res() res: Response) {
    res.status(200).json({ isValid: true });
  }
}
