import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserStatus } from 'src/common/enums/user-status';
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
      smsTargetNumber?: string;
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
    this.smsCode = user.smsCode;
    this.smsTargetNumber = user.smsTargetNumber;
    this.sessionId = user.sessionId;
  }

  smsCode: string;
  smsTargetNumber?: string;
}
