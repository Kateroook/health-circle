import { SetupPasswordReasons } from '../enums/setup-password-reasons';

export class SetupPasswordConfirmationDto {
  token: string;
  reason: SetupPasswordReasons;
}
