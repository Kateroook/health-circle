import { utils } from '../../../utils/utils';
import { UserEntity } from '../../types/entites/user-interface';

export class UserBuilder {
  private user: UserEntity;
  constructor(overrides?: Partial<UserEntity>) {
    this.user = {
      firstName: utils.random.firstName(),
      lastName: utils.random.lastName(),
      email: utils.random.email(),
      phone: utils.random.phone(),
      password: utils.random.password(12),
      ...overrides,
    };
  }

  withFirstName(firstName: string): this {
    this.user.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.user.lastName = lastName;
    return this;
  }

  withMiddleName(middleName: string): this {
    this.user.middleName = middleName;
    return this;
  }

  withPhone(phone: string): this {
    this.user.phone = phone;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withFullName(fullName?: string): this {
    this.user.fullName = fullName || `${this.user.firstName} ${this.user.lastName}`;
    return this;
  }

  build(): UserEntity {
    return this.user;
  }
}
