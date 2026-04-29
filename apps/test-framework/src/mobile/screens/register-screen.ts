import { ScreenIds } from '../../../../client/src/utils/testIDs';
import { utils } from '../../utils/utils';
import BaseScreen from './base-screen';

class RegisterScreen extends BaseScreen {
  constructor() {
    super(`~${ScreenIds.register}`, 'Register');
  }

  get phonePrefix() {
    return $('~auth:phone:prefix');
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
    return $('~auth:login:link');
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
    return $(`~auth:phone:country_${countryCode}`);
  }

  async fillPhone(phone?: string, countryCode?: string) {
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

  async fillEmail(email?: string) {
    await this.wait(this.emailInput);
    if (email) {
      await this.emailInput.setValue(email);
    }
  }

  async fillContactInfo(countryCode: string = 'Україна', phone?: string, email?: string) {
    await this.fillPhone(phone, countryCode);
    await this.fillEmail(email);
    await this.clickNextButton();
  }

  async fillLastName(lastName?: string) {
    await this.wait(this.lastNameInput);
    if (lastName) {
      await this.lastNameInput.setValue(lastName);
    }
  }

  async fillFirstName(firstName?: string) {
    await this.wait(this.firstNameInput);
    if (firstName) {
      await this.firstNameInput.setValue(firstName);
    }
  }

  async fillMiddleName(middleName?: string) {
    await this.wait(this.middleNameInput);
    if (middleName) {
      await this.middleNameInput.setValue(middleName);
    }
  }

  async fillNameInfo(lastName?: string, firstName?: string, middleName?: string) {
    await this.fillLastName(lastName);
    await this.fillFirstName(firstName);
    if (middleName) {
      await this.fillMiddleName(middleName);
    }
    await this.clickNextButton();
  }

  async register(data?: {
    countryCode?: string;
    phoneWithoutCode?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
  }) {
    const countryCode = data?.countryCode ?? utils.random.countryCode();
    const phone = data?.phoneWithoutCode ?? utils.random.phone();
    const email = data?.email ?? utils.random.email();
    const firstName = data?.firstName ?? utils.random.firstName();
    const lastName = data?.lastName ?? utils.random.lastName();

    const middleName = data?.middleName;

    await this.fillContactInfo(countryCode, phone, email);

    await this.fillNameInfo(lastName, firstName, middleName);
  }

  async clickNextButton() {
    await this.tap(this.nextButton);
  }

  async clickLoginLink() {
    await this.tap(this.loginLink);
  }

  async clickBackButton() {
    await this.tap(this.backButton);
  }
}

export default new RegisterScreen();
