import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUIdParamDto } from 'src/common/dto/uuid-param.dto';
import { UserEntity } from 'src/common/entities/user.entity';

import { AuthStrategies } from 'src/common/enums/auth-strategies';
import { UserJwtAccessGuard } from 'src/common/guards/user-jwt-access.guard';
import type { AuthRequest } from 'src/common/types/auth-request';
import { CreateUserDto } from './dto/create-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users CRUD API')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get(':id')
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  @ApiOperation({ summary: 'Retrieve user by id' })
  @ApiOkResponse({ type: UserEntity, description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getOne(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.getOne(params.id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user with relations' })
  @ApiCreatedResponse({
    type: UserEntity,
    description: 'User created successfully',
  })
  async create(@Body() body: CreateUserDto, @Req() req: AuthRequest) {
    return this.service.save(body, req.metadata, true, req.user);
  }

  @Put()
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  @ApiOperation({ summary: 'Modify user with relations' })
  @ApiOkResponse({ type: UserEntity, description: 'User updated successfully' })
  async modify(@Body() body: ModifyUserDto, @Req() req: AuthRequest) {
    return this.service.save(body, req.metadata, false, req.user);
  }

  @Patch(':id/reset-password')
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.resetPassword(params.id, req.metadata);
  }
}
