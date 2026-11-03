// oxlint-disable react-hooks/rules-of-hooks
import { mkdir, mkdtemp } from "node:fs/promises";
import path from "node:path";

import { defineNetworkFixture, type NetworkFixture } from "@msw/playwright";
import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  LaunchOptions,
  Page,
} from "playwright";
import { chromium } from "playwright";
import type { TestAPI } from "vite-plus/test";
import { inject, test as baseTest } from "vite-plus/test";

import { bypassLocalRequests } from "../common/msw";

export interface E2EFixtures {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  network: NetworkFixture;
  fontsLoaded: () => Promise<void>;
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
  context: async ({ browser, task }, use) => {
    const context = await browser.newContext(inject("e2e").contextOptions);
    context.setDefaultTimeout(30_000);
    context.setDefaultNavigationTimeout(30_000);
    try {
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
      await use(context);
      if (task.result?.state === "fail") {
        const outputRoot = path.resolve("test-results/e2e");
        await mkdir(outputRoot, { recursive: true });
        const outputDir = await mkdtemp(path.join(outputRoot, `${task.id}-`));
        console.error(`E2E failure artifacts for "${task.name}": ${outputDir}`);
        try {
          await Promise.all(
            context
              .pages()
              .filter((page) => !page.isClosed())
              .map((page, index) =>
                page.screenshot({
                  path: path.join(outputDir, `page-${index + 1}.png`),
                  fullPage: true,
                  timeout: 5_000,
                }),
              ),
          );
        } finally {
          await context.tracing.stop({ path: path.join(outputDir, "trace.zip") });
        }
      } else {
        await context.tracing.stop();
      }
    } finally {
      await context.close();
    }
  },
  network: [
    async ({ context }, use) => {
      const { baseURL = "" } = inject("e2e").contextOptions;
      const network = defineNetworkFixture({
        context,
        onUnhandledFrame: bypassLocalRequests(baseURL),
      });
      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
  page: async ({ context }, use) => {
    const page = await context.newPage();
    // The context closes pages after capturing failure artifacts.
    await use(page);
  },
  fontsLoaded: async ({ page }, use) => {
    await use(() =>
      page.evaluate(async () => {
        await document.fonts.ready;
        await document.fonts.load('24px "Material Symbols Sharp"');
      }),
    );
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
export function createTest<T extends Record<string, new (page: Page) => unknown>>(
  models: T,
): TestAPI<
  E2EFixtures & {
    [K in keyof T]: InstanceType<T[K]>;
  }
> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return extendedTest.extend(
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
    ),
  ) as never;
}

export const test = createTest({});
