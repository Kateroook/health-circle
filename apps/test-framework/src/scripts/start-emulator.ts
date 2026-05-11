import { execSync, spawn } from 'child_process';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForEmulatorToBoot(maxWaitMs = 120000) {
  const pollIntervalMs = 2000;
  const maxAttempts = maxWaitMs / pollIntervalMs;
  let attempts = 0;

  console.log('[...] Polling emulator boot status (waiting for sys.boot_completed)...');

  while (attempts < maxAttempts) {
    try {
      const bootStatus = execSync('adb shell getprop sys.boot_completed', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      if (bootStatus === '1') {
        console.log('[+] Android OS successfully booted and ready!');
        await sleep(2000);
        return;
      }
    } catch (e) {}

    attempts++;
    await sleep(pollIntervalMs);
  }

  throw new Error(`[-] Emulator did not boot within ${maxWaitMs / 1000} seconds.`);
}

async function run() {
  try {
    const devices = execSync('adb devices').toString();
    if (devices.includes('emulator')) {
      console.log('[+] Emulator already started.');
      process.exit(0);
    }

    console.log("[?] Emulator couldn't be found. Searching for accessible AVD...");

    const avdsOutput = execSync('emulator -list-avds').toString().trim();
    if (!avdsOutput) {
      console.error('[-] No emulator setups were found (AVD)!');
      process.exit(1);
    }

    const firstAvd = avdsOutput.split('\n')[0].trim();
    console.log(`[...] Starting: ${firstAvd}`);

    const emuProcess = spawn('emulator', ['-avd', firstAvd, '-no-snapshot-load', '-dns-server', '8.8.8.8'], {
      detached: true,
      stdio: 'ignore',
    });
    emuProcess.unref();

    await waitForEmulatorToBoot();

    console.log('[+] Setup complete! Passing control to Appium.');
    process.exit(0);
  } catch (error: any) {
    console.error('[-] Error starting an emulator:', error.message);
    process.exit(1);
  }
}

run();
