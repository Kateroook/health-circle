import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthStrategies } from 'src/common/enums/auth-strategies';
import { UserJwtAccessGuard } from 'src/common/guards/user-jwt-access.guard';
import type { AuthRequest } from 'src/common/types/auth-request';

import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  findAll(@Req() req: AuthRequest) {
    return this.contactsService.findAllForUser(req.user.id);
  }

  @Post()
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  create(@Req() req: AuthRequest, @Body() dto: CreateContactDto) {
    return this.contactsService.create(req.user.id, dto);
  }

  @Patch(':targetId')
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  update(
    @Req() req: AuthRequest,
    @Param('targetId') targetId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(req.user.id, targetId, dto);
  }

  @Delete(':targetId')
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  remove(@Req() req: AuthRequest, @Param('targetId') targetId: string) {
    return this.contactsService.remove(req.user.id, targetId);
  }
}
