import { OmitType } from '@nestjs/swagger';

import { UserChangePasswordDto } from './user-change-password.dto';

export class UserSetupPasswordDto extends OmitType(UserChangePasswordDto, ['oldPassword' as const]) {}
