// oxlint-disable react-hooks/rules-of-hooks
import { defineNetworkFixture, type NetworkFixture } from "@msw/playwright";
import { test as baseTest, type Page, type PlaywrightTestArgs } from "@playwright/test";

import { bypassLocalRequests } from "../common/msw";

export interface E2EFixtures {
  network: NetworkFixture;
  fontsLoaded: () => Promise<void>;
}

const extendedTest = baseTest.extend<E2EFixtures>({
  network: [
    async ({ context, baseURL }, use) => {
      const network = defineNetworkFixture({
        context,
        onUnhandledFrame: bypassLocalRequests(baseURL ?? ""),
      });
      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
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
 * Create a Playwright test with per-test page object model fixtures.
 * @example
 * const test = createTest({ home: HomePage });
 * test("home page", async ({ home }) => {
 *   await home.goto();
 * });
 */
export function createTest<T extends Record<string, new (page: Page) => unknown>>(models: T) {
  return extendedTest.extend<{ [K in keyof T]: InstanceType<T[K]> }>(
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    Object.fromEntries(
      Object.entries(models).map(([name, Model]) => [
        name,
        async ({ page }: PlaywrightTestArgs, use: (model: unknown) => Promise<void>) => {
          await use(new Model(page));
        },
      ]),
    ) as never,
  );
}

export const test = createTest({});
