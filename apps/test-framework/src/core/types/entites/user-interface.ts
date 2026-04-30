export interface UserEntity {
  id?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  email: string;
  phone: string;
  password: string;
  phoneWithoutCode?: string;
  countryCode?: string;
}
