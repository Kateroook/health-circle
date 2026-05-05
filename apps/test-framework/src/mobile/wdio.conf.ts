// import { browser } from '@wdio/globals';
import path from 'path';
import { BackendProvider } from '../core/backend-provider';

export const config: WebdriverIO.Config = {
  //Where to find tests
  specs: ['./tests/**/*.spec.ts'],
  protocol: 'http',
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',
  maxInstances: 1,

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
      'appium:enforceAppInstall': true,
      'appium:platformName': 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:platformVersion': process.env.APPIUM__PLATFORM_VERSION!,
      'appium:deviceName': process.env.APPIUM__DEVICE_NAME!,
      'appium:app': path.join(process.cwd(), '../client/android/app/build/outputs/apk/release/app-release.apk'),
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 300,
      'appium:udid': process.env.APPIUM__DEVICE_NAME!,
      'appium:ignoreHiddenApiPolicyError': true,
      'wdio:maxInstances': 1,
    },
  ],

  //Test runners and reporters
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    timeout: 60000,
  },

  //BackendProvider integration
  before: async function () {
    // Add backendProvider globally into browser object,
    // so it'll be accessible in any test
    const provider = await BackendProvider.init();
    (global as any).browser.backend = provider;
  },

  afterTest: async function () {
    if ((browser as any).backend) {
      await (global as any).browser.backend.api.clearContext();
      await (global as any).browser.backend.cleanup();
      // await (global as any).browser.backend.dispose();
    }
  },

  after: async function () {
    await (global as any).browser.backend.dispose();
  },
};
