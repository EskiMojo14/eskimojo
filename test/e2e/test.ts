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

const extendedTest = baseTest.extend<E2EFixtures>({
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

/**
 * Create an extended test object with page object models.
 * @param models An object mapping model names to their classes.
 * @returns An extended test object with the models available.
 *
 * @example
 * const test = createTest({ dialog: DialogModel })
 *
 * test("example test", async ({ dialog }) => {
 *   await dialog.open();
 * });
 */
export function createTest<T extends Record<string, new (page: Page) => unknown>>(models: T) {
  return extendedTest.extend<{
    [K in keyof T]: InstanceType<T[K]>;
  }>(
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    Object.fromEntries(
      Object.entries(models).map(
        ([key, Model]): [
          string,
          (
            args: { page: Page },
            use: (instance: InstanceType<typeof Model>) => Promise<void>,
          ) => Promise<void>,
        ] => [
          key,
          async ({ page }, use) => {
            const instance = new Model(page);
            await use(instance);
          },
        ],
      ),
    ) as never,
  );
}

export const test = createTest({});
