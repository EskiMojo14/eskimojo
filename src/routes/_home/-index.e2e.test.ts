import { createTest, expect } from "#test/e2e";

import { HomePage } from "./-index.e2e.model";

const test = createTest({ home: HomePage });

test.beforeEach(async ({ home, fontsLoaded }) => {
  await home.goto();
  await fontsLoaded();
});

test("Social links display correctly", async ({ home }) => {
  await expect.locator(home.socialLink("GitHub")).toBeVisible();
  await expect.locator(home.socialLink("Twitter")).toBeVisible();
  await expect.locator(home.socialLink("Bluesky")).toBeVisible();
});
