import { IsDefined, IsEnum } from 'class-validator';
import { UserStatus } from 'src/common/enums/user-status';

export class UpdateUserStatusDto {
  @IsDefined()
  @IsEnum(UserStatus)
  status: UserStatus;
}
