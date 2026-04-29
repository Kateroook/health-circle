import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { rmSync } from 'fs';
import { platform } from 'os';
import { join } from 'path';

dotenv.config();
const API_ENVIRONMENTS = {
  stage: process.env.STAGING_API_BASE_URL,
  prod: process.env.PROD_API_BASE_URL,
};

const args = process.argv.slice(2);
const envName = args.includes('--prod') ? 'prod' : 'stage';
const apiUrl = API_ENVIRONMENTS[envName];

const isWindows = platform() === 'win32';
const clientDir = join(process.cwd(), '../client');
const androidDir = join(clientDir, 'android');

console.log(`\n[Build] Environment: ${envName.toUpperCase()}`);
console.log(`[Build] API URL: ${apiUrl}`);

try {
  console.log('[Build] Cleaning old android folder...');
  rmSync(androidDir, { recursive: true, force: true });

  console.log('[Build] Running Expo prebuild...');
  execSync(`npx expo prebuild --platform android --clean`, {
    cwd: clientDir,
    stdio: 'inherit',
    env: { ...process.env, EXPO_PUBLIC_API_URL: apiUrl + '/api', EXPO_NO_CACHE: '1' },
  });

  console.log('🔨 [Build] Compiling APK...');
  const gradleCmd = isWindows ? 'gradlew.bat assembleRelease' : './gradlew assembleRelease';
  execSync(gradleCmd, {
    cwd: androidDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_PUBLIC_API_URL: apiUrl + '/api',
      RCT_NO_VENDORED_CACHES: '1',
      EXPO_NO_CACHE: '1',
    },
  });

  console.log('[Build] APK successfully built!\n');
} catch (error: any) {
  console.error('[Build] Failed:', error.message);
  process.exit(1);
}
