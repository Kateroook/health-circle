import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUIdParamDto } from 'src/common/dto/uuid-param.dto';
import { GroupEntity } from 'src/common/entities/group.entity';
import { AuthStrategies } from 'src/common/enums/auth-strategies';
import { UserJwtAccessGuard } from 'src/common/guards/user-jwt-access.guard';
import type { AuthRequest } from 'src/common/types/auth-request';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './groups.service';

@ApiTags('API груп')
@ApiBearerAuth(AuthStrategies.userJwtAccess)
@UseGuards(UserJwtAccessGuard)
@Controller('groups')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Get()
  @ApiOperation({ summary: 'Отримати всі групи користувача' })
  @ApiOkResponse({ type: [GroupEntity], description: 'Список груп' })
  async getAll(@Req() req: AuthRequest) {
    return this.service.findAllForUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати групу за id' })
  @ApiOkResponse({ type: GroupEntity, description: 'Групу знайдено' })
  @ApiNotFoundResponse({ description: 'Групу не знайдено' })
  async getOne(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.findOne(params.id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Створити нову групу' })
  @ApiCreatedResponse({ type: GroupEntity, description: 'Групу створено' })
  async create(@Body() body: CreateGroupDto, @Req() req: AuthRequest) {
    return this.service.createGroup(req.user.id, body);
  }

  @Put()
  @ApiOperation({ summary: 'Оновити групу' })
  @ApiOkResponse({ type: GroupEntity, description: 'Групу оновлено' })
  @ApiNotFoundResponse({ description: 'Групу не знайдено' })
  async update(@Body() body: UpdateGroupDto, @Req() req: AuthRequest) {
    return this.service.updateGroup(req.user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити групу' })
  @ApiOkResponse({ description: 'Групу видалено' })
  @ApiNotFoundResponse({ description: 'Групу не знайдено' })
  async delete(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.deleteGroup(req.user.id, params.id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Створити запрошення в групу (magic link)' })
  @ApiCreatedResponse({ description: 'Запрошення створено' })
  async createInvite(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.generateInviteLink(req.user.id, params.id);
  }

  @Post('join')
  @ApiOperation({ summary: 'Приєднатись до групи по magic link' })
  @ApiOkResponse({ description: 'Ви приєдналися до групи' })
  @ApiNotFoundResponse({ description: 'Посилання недійсне або прострочене' })
  async joinGroup(@Body() body: JoinGroupDto, @Req() req: AuthRequest) {
    return this.service.joinByInvite(req.user.id, body.token);
  }
}
