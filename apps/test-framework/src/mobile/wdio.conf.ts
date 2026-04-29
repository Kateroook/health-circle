import { browser } from '@wdio/globals';
import { BackendProvider } from '../core/backend-provider';

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
      'appium:enforceAppInstall': true,
      'appium:platformName': 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:platformVersion': process.env.APPIUM__PLATFORM_VERSION!,
      'appium:deviceName': process.env.APPIUM__DEVICE_NAME!,
      'appium:app': 'C:/apps/health-circle-stage-71-android.apk',
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 300,
      'appium:udid': process.env.APPIUM__DEVICE_NAME!,
      'appium:ignoreHiddenApiPolicyError': true,
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
    console.log('>>> STARTING BACKEND INIT');
    const provider = await BackendProvider.init();
    (global as any).backend = provider;
    console.log('>>> BACKEND READY');
  },

  afterTest: async function () {
    if ((browser as any).backend) {
      await browser.backend.cleanup();
      await browser.backend.dispose();
    }
  },
};
