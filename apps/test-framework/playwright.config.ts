import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.API_BASE_URL!;

export default defineConfig({
  testDir: "./src/api/tests",
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 8,
  reporter: "html",

  use: {
    baseURL: baseUrl,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
    trace: "on-first-retry",
    isolate: true,
  },

  projects: [
    {
      name: "API Tests",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
