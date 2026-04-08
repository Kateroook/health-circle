import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserStatus } from 'src/common/enums/user-status';
import { UserEntity } from 'src/users/entities/user.entity';

export class UserProfileDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  middleName?: string;

  @Expose()
  lastName: string;

  @Expose()
  fullName: string | null;

  @Expose()
  email: string | null;

  @Expose()
  phone: string | null;

  @Expose()
  avatarUpdatedAt?: Date;

  @Expose()
  status: UserStatus;
  region: string | null;
  district: string | null;
  alertRegionUid: number | null;

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
    this.status = user.status;
    this.region = user.region;
    this.district = user.district;
    this.alertRegionUid = user.alertRegionUid;
    this.sessionId = user.sessionId;
  }
}
