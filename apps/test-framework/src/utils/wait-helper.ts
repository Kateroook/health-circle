export class WaitHelper {
  private readonly CI_MULTIPLIER = Number(process.env.CI_TIMEOUT_MULTIPLIER) || 6;

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  resolveTimeout(ms: number): number {
    return process.env.CI ? ms * this.CI_MULTIPLIER : ms;
  }
}

export const waitHelper = new WaitHelper();

export const timeout = {
  short: waitHelper.resolveTimeout(1_000),
  medium: waitHelper.resolveTimeout(2_000),
  long: waitHelper.resolveTimeout(5_000),
  extraLong: waitHelper.resolveTimeout(10_000),
  cronTimeout: 10_000,
  gracePeriod: 20_000,
  statusExpiry: 60_000,
  rollCallTimeout: 40_000,
};
