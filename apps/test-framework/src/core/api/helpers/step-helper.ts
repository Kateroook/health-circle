import { test } from '@playwright/test';

/**
 * Універсальна обгортка для тестових кроків.
 * Використовує Playwright test.step, якщо запущено через Playwright,
 * або просто виконує код без кроку (чи з кастомним логом), якщо через WDIO.
 */
export async function runStep<T>(name: string, callback: () => Promise<T>): Promise<T> {
  // WebdriverIO завжди встановлює змінну оточення WDIO_WORKER_ID для своїх воркерів
  const isWdio = process.env.WDIO_WORKER_ID !== undefined;

  if (isWdio) {
    console.log(name);
    return await callback();
  }

  return await test.step(name, callback);
}
