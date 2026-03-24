import { BackendProvider } from '../core/backend-provider';
import { browser } from '@wdio/globals';
import path from 'path';

export const config: WebdriverIO.Config = {
    //Where to find tests
    specs: ['./tests/**/*.spec.ts'],
    
    //Platform settings
    capabilities: [{
        'appium:platformName': 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': 'Android_Device', // For a real device it's just a label
        // Enter path to your .apk  (if you already have a build)
        'appium:app': path.join(process.cwd(), './mobile/apps/your-app.apk'), 
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