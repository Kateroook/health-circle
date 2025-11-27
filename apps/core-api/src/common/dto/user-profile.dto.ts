import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/common/entities/user.entity';

export class UserProfileDto {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string | null;
  phone: string | null;

  @ApiHideProperty()
  @Exclude()
  sessionId?: string;

  constructor(
    user: UserEntity & {
      sessionId?: string;
      isPasswordExpired?: boolean;
      isPasswordRevoked?: boolean;
    },
  ) {
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.middleName = user.middleName;
    this.email = user.email;
    this.phone = user.phone;
    this.sessionId = user.sessionId;
  }
}
