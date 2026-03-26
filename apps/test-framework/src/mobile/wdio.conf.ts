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
    
    //Platform settings
    capabilities: [{
        'appium:noReset': false,
        'appium:shouldTerminateApp': true,
        'appium:platformName': 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:platformVersion': '16.0',
        'appium:deviceName': 'emulator-5554', // For a real device it's just a label
        // Enter path to your .apk  (if you already have a build)
        'appium:app': path.join(process.cwd(), '../client/android/app/build/outputs/apk/release/app-release.apk'), 
        'appium:autoGrantPermissions': true,
        'appium:newCommandTimeout': 300,
    }],

    //Test runners and reporters
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        timeout: 60000
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
    }
};