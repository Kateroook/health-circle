import { BackendProvider } from '../core/backend-provider';
import { browser } from '@wdio/globals';
import path from 'path';

export const config: WebdriverIO.Config = {
  //Where to find tests
  specs: ['./tests/**/*.spec.ts'],
  protocol: 'http',
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',

  services: [
    [
      'appium',
      {
        args: {
          address: '127.0.0.1',
          port: 4723,
          relaxedSecurity: true, // Корисно для деяких команд ADB
        },
        command: 'appium',
      },
    ],
  ],

  //Platform settings
  capabilities: [
    {
      'appium:noReset': false,
      'appium:shouldTerminateApp': true,
      'appium:platformName': 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:platformVersion': process.env.APPIUM__PLATFORM_VERSION!,
      'appium:deviceName': process.env.APPIUM__DEVICE_NAME!,
      'appium:app': path.join(process.cwd(), '../client/android/app/build/outputs/apk/release/app-release.apk'),
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 300,
    },
  ],

  //Test runners and reporters
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    timeout: 60000,
  },

  //BackendProvider integration
  beforeTest: async function () {
    // Add backendProvider globally into browser object,
    // so it'll be accessible in any test
    const provider = await BackendProvider.init();
    browser.backend = provider;
  },

  afterTest: async function () {
    if ((browser as any).backend) {
      await browser.backend.cleanup();
      await browser.backend.dispose();
    }
  },
};
