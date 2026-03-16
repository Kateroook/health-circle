import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserEntity } from 'src/users/entities/user.entity';

export class UserProfileDto {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUpdatedAt?: Date;

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
    this.middleName = user.middleName ?? undefined;
    this.fullName = user.fullName;
    this.email = user.email;
    this.phone = user.phone;
    this.avatarUpdatedAt = user.avatarUpdatedAt;
    this.sessionId = user.sessionId;
  }
}
