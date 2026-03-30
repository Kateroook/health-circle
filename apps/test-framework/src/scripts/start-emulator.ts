import { execSync, spawn } from 'child_process';

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

  const emuProcess = spawn('emulator', ['-avd', firstAvd], {
    detached: true,
    stdio: 'ignore',
  });
  emuProcess.unref();

  console.log('[...] Waiting for 30 second for system to load');

  setTimeout(() => {
    console.log('[+] Emulator successfully started!');
    process.exit(0);
  }, 30_000);
} catch (error: any) {
  console.error('[-] Error starting an emulator:', error.message);
  process.exit(1);
}
