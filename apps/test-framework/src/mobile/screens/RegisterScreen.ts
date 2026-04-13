import { ScreenIds } from '../../../../client/src/utils/testIDs';
import BaseScreen from './base-screen';

class RegisterScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.register}`, 'Register');
  }

  get phonePrefix() {
    return $('//*[@text="+380"]');
  }
  get phoneInput() {
    return $('~auth:phone:input');
  }
  get emailInput() {
    return $('~auth:middleName:input');
  }
  get nextButton() {
    return $('~auth:next:button');
  }

  get loginLink() {
    return $('//*[@text="Увійти"]');
  }

  get lastNameInput() {
    return $('~auth:lastName:input');
  }
  get firstNameInput() {
    return $('~auth:firstName:input');
  }
  get middleNameInput() {
    return $('~auth:middleName:input');
  }
  get backButton() {
    return $('~auth:back:button');
  }

  countryOption(countryCode: string) {
    return $(`//*[contains(@text, "${countryCode}")]`);
  }

  async phone(phone?: string, countryCode?: string) {
    await this.wait(this.phoneInput);
    if (countryCode) {
      await this.tap(this.phonePrefix);
      const targetCountry = this.countryOption(countryCode);
      await this.tap(targetCountry);
    }
    if (phone) {
      await this.phoneInput.setValue(phone);
    }
  }

  async email(email?: string) {
    await this.wait(this.emailInput);
    if (email) {
      await this.emailInput.setValue(email);
    }
  }

  async fillContactInfo(countryCode: string = 'Україна', phone?: string, email?: string) {
    await this.phone(phone, countryCode);
    await this.email(email);
    await this.tap(this.nextButton);
  }

  async lastName(lastName?: string) {
    await this.wait(this.lastNameInput);
    if (lastName) {
      await this.lastNameInput.setValue(lastName);
    }
  }

  async firstName(firstName?: string) {
    await this.wait(this.firstNameInput);
    if (firstName) {
      await this.firstNameInput.setValue(firstName);
    }
  }

  async middleName(middleName?: string) {
    await this.wait(this.middleNameInput);
    if (middleName) {
      await this.middleNameInput.setValue(middleName);
    }
  }

  async fillNameInfo(lastName?: string, firstName?: string, middleName?: string) {
    await this.lastName(lastName);
    await this.firstName(firstName);
    await this.middleName(middleName);
    await this.tap(this.nextButton);
  }

  async fullRegistration(
    countryCode?: string,
    phone?: string,
    email?: string,
    lastName?: string,
    firstName?: string,
    middleName?: string,
  ) {
    await this.fillContactInfo(countryCode, phone, email);
    await this.fillNameInfo(lastName, firstName, middleName);
  }

  async nextButtonClick() {
    await this.tap(this.nextButton);
  }

  async loginRedirection() {
    await this.tap(this.loginLink);
  }

  async backClick() {
    await this.tap(this.backButton);
  }
}

export default new RegisterScreen();
