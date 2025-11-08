import { SetupPasswordReasons } from '../enums/setup-password-reasons';

export class SetupPasswordConfirmationDto {
  code: string;
  reason: SetupPasswordReasons;
}
