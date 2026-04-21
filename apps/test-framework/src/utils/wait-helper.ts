export class WaitHelper {
  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const timeout = {
  short: 1_000,
  medium: 2_000,
  long: 5_000,
  extraLong: 10_000,
  cronTimeout: 10_000,
  gracePeriod: 20_000,
  statusExpiry: 60_000,
  rollCallTimeout: 40_000,
};
