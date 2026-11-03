import { defineConfig, devices } from "@playwright/test";

import { getSystemColorScheme } from "../test/e2e/util";

const externalURL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "..",
  testMatch: "**/*.e2e.test.ts",
  outputDir: "../test-results/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "../playwright-report", open: "never" }],
    [process.env.CI ? "github" : "list"],
  ],
  use: {
    headless: process.env.HEADLESS !== "false",
    baseURL: externalURL ?? "http://localhost:4173",
    colorScheme: getSystemColorScheme(),
    serviceWorkers: "block",
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: { mode: "only-on-failure", fullPage: true },
  },
  projects: [
    {
      name: "Desktop Chrome",
      grepInvert: /@mobile/,
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
    {
      name: "Mobile Chrome",
      grepInvert: /@desktop/,
      use: { ...devices["Pixel 5"], channel: "chromium" },
    },
  ],
  webServer: externalURL
    ? undefined
    : {
        command: "vp run preview --port 4173 --strictPort",
        cwd: "..",
        url: "http://localhost:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
