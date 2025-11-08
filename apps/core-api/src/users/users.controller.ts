import { Body, Controller, Get, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UUIdParamDto } from 'src/common/dto/uuid-param.dto';
import { UserEntity } from 'src/common/entities/user.entity';

import type { AuthRequest } from 'src/common/types/auth-request';
import { CreateUserDto } from './dto/create-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
import { UsersService } from './users.service';

// TODO: add access checks
@ApiTags('Users CRUD API')
@Controller('users')
// @ApiCookieAuth(AuthStrategies.userJwtAccess)
// @UseGuards(UserJwtAccessGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve user by id' })
  @ApiOkResponse({ type: UserEntity, description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getOne(@Param() params: UUIdParamDto) {
    return this.service.getOne(params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user with relations' })
  @ApiCreatedResponse({
    type: UserEntity,
    description: 'User created successfully',
  })
  async create(@Body() body: CreateUserDto, @Req() req: AuthRequest) {
    return this.service.save(body, req.metadata, true);
  }

  @Put()
  @ApiOperation({ summary: 'Modify user with relations' })
  @ApiOkResponse({ type: UserEntity, description: 'User updated successfully' })
  async modify(@Body() body: ModifyUserDto, @Req() req: AuthRequest) {
    return this.service.save(body, req.metadata, false);
  }

  @Patch(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.resetPassword(params.id, req.metadata);
  }
}
