import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { UUIdParamDto } from 'src/common/dto/uuid-param.dto';
import { UserEntity } from 'src/common/entities/user.entity';

import { FileInterceptor } from '@nestjs/platform-express';
import { UserProfileDto } from 'src/common/dto/user-profile.dto';
import { AuthStrategies } from 'src/common/enums/auth-strategies';
import { UserJwtAccessGuard } from 'src/common/guards/user-jwt-access.guard';
import type { AuthRequest } from 'src/common/types/auth-request';
import { CreateUserDto } from './dto/create-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
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

  @Get(':id/avatar')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get a user avatar image' })
  @ApiProduces('image/*')
  @ApiOkResponse({ description: 'User avatar image stream' })
  async getAvatar(@Param() params: UUIdParamDto): Promise<StreamableFile> {
    return this.service.getFile(params.id);
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

  @Put('/status')
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  @ApiOperation({ summary: 'Modify user status' })
  @ApiOkResponse({ type: UserEntity, description: 'User status updated successfully' })
  async updateStatus(@Body() body: UpdateUserStatusDto, @Req() req: AuthRequest) {
    return this.service.updateStatus(req.user.id, body.status);
  }

  @Put('/fcm-token')
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  @ApiOperation({ summary: 'Save user FCM token' })
  @ApiOkResponse({ type: UserEntity, description: 'User FCM token updated successfully' })
  @ApiOperation({ summary: 'Save FCM Token for push notifications' })
  async saveToken(@Body() body: { token: string }, @Req() req: AuthRequest) {
    return this.service.saveFcmToken(req.user.id, body.token);
  }

  @Patch(':id/reset-password')
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(@Param() params: UUIdParamDto, @Req() req: AuthRequest) {
    return this.service.resetPassword(params.id, req.metadata);
  }

  @Put(':id/avatar')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Upload or replace a user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: UserProfileDto, description: 'User avatar uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Param() params: UUIdParamDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.upsertFile(params.id, file);
  }

  @Delete()
  @ApiBearerAuth(AuthStrategies.userJwtAccess)
  @UseGuards(UserJwtAccessGuard)
  @ApiOperation({ summary: 'Delete the authenticated user' })
  @ApiOkResponse({ description: 'User deleted successfully' })
  async remove(@Req() req: AuthRequest) {
    return this.service.remove(req.user.id, req.user, req.metadata);
  }

  @Delete(':id/avatar')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove user avatar by ID' })
  @ApiCookieAuth()
  @ApiNoContentResponse({ description: 'User avatar removed' })
  @ApiNotFoundResponse({ description: 'File not found' })
  async removeLogo(@Param() params: UUIdParamDto) {
    await this.service.removeFile(params.id);
  }
}
