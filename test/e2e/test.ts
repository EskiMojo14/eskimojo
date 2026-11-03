// oxlint-disable react-hooks/rules-of-hooks
import { defineNetworkFixture, type NetworkFixture } from "@msw/playwright";
import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  LaunchOptions,
  Page,
} from "playwright";
import { chromium } from "playwright";
import { inject, test as baseTest } from "vite-plus/test";

export interface E2EFixtures {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  network: NetworkFixture;
}

declare module "vitest" {
  interface ProvidedContext {
    e2e: {
      launchOptions: LaunchOptions;
      contextOptions: BrowserContextOptions;
    };
  }
}

export const test = baseTest.extend<E2EFixtures>({
  browser: [
    // oxlint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const browser = await chromium.launch(inject("e2e").launchOptions);
      await use(browser);
      await browser.close();
    },
    { scope: "worker" },
  ],
  context: async ({ browser }, use) => {
    const context = await browser.newContext(inject("e2e").contextOptions);
    await use(context);
    await context.close();
  },
  network: [
    async ({ context }, use) => {
      const network = defineNetworkFixture({ context });
      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});
