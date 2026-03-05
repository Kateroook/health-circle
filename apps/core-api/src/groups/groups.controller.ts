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

@ApiTags('Groups API')
@ApiBearerAuth(AuthStrategies.userJwtAccess)
@UseGuards(UserJwtAccessGuard)
@Controller('groups')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Get()
  @ApiOperation({ summary: 'Get all groups of the current user' })
  @ApiOkResponse({ type: [GroupEntity], description: 'List of groups' })
  async getAll(@Req() req: AuthRequest) {
    return this.service.findAllForUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiOkResponse({ type: GroupEntity, description: 'Group found' })
  @ApiNotFoundResponse({ description: 'Group not found' })
  async getOne(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.findOne(params.id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiCreatedResponse({ description: 'Group created with invite code' })
  async create(@Body() body: CreateGroupDto, @Req() req: AuthRequest) {
    return this.service.createGroup(req.user.id, body);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a group' })
  @ApiOkResponse({ description: 'Successfully left the group' })
  async leave(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.leaveGroup(req.user.id, params.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update a group' })
  @ApiOkResponse({ type: GroupEntity, description: 'Group updated' })
  @ApiNotFoundResponse({ description: 'Group not found' })
  async update(@Body() body: UpdateGroupDto, @Req() req: AuthRequest) {
    return this.service.updateGroup(req.user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group' })
  @ApiOkResponse({ description: 'Group deleted successfully' })
  @ApiNotFoundResponse({ description: 'Group not found' })
  async delete(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.deleteGroup(req.user.id, params.id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Generate a new invite code for the group' })
  @ApiCreatedResponse({ description: 'New invite code generated' })
  async regenerateInvite(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.regenerateInviteCode(req.user.id, params.id);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a group using an invite code' })
  @ApiOkResponse({ description: 'Successfully joined the group' })
  @ApiNotFoundResponse({ description: 'Invalid or expired invite code' })
  async joinGroup(@Body() body: JoinGroupDto, @Req() req: AuthRequest) {
    return this.service.joinByInviteCode(req.user.id, body.code);
  }

  @Post(':id/block/:userId')
  @ApiOperation({ summary: 'Block a user from the group' })
  @ApiOkResponse({ description: 'User blocked successfully' })
  async blockUser(@Param('id') groupId: string, @Param('userId') userId: string, @Req() req: AuthRequest) {
    return this.service.blockUser(groupId, userId, req.user.id);
  }

  @Delete(':id/block/:userId')
  @ApiOperation({ summary: 'Unblock a user from the group' })
  @ApiOkResponse({ description: 'User unblocked successfully' })
  async unblockUser(@Param('id') groupId: string, @Param('userId') userId: string, @Req() req: AuthRequest) {
    return this.service.unblockUser(groupId, userId, req.user.id);
  }

  @Get(':id/blocked-users')
  @ApiOperation({ summary: 'Get all blocked users for the group' })
  @ApiOkResponse({ description: 'List of blocked users' })
  async getBlockedUsers(@Param('id') groupId: string, @Req() req: AuthRequest) {
    return this.service.getBlockedUsers(groupId, req.user.id);
  }
}
