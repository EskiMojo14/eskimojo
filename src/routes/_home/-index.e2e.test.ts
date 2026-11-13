import { createTest, expect } from "#test/e2e";

import { HomePage } from "./-index.e2e.model";

const test = createTest({ home: HomePage });

test.beforeEach(async ({ home, fontsLoaded }) => {
  await home.goto();
  await fontsLoaded();
});

test("Social links display correctly", async ({ home }) => {
  await expect(home.socialLink("GitHub")).toBeVisible();
  await expect(home.socialLink("Twitter")).toBeVisible();
  await expect(home.socialLink("Bluesky")).toBeVisible();
});

test("Christmas override serves the seasonal hero and Goat artwork", async ({ home, page }) => {
  const goat = page.waitForResponse((response) =>
    response.url().endsWith("/Goat-sidebar-christmas.webp"),
  );
  const mitzi = page.waitForResponse((response) =>
    response.url().endsWith("/Mitzi-hero-christmas.webp"),
  );
  home.url = "/?christmas=true";
  const response = await home.goto();

  expect(response).not.toBeNull();
  const html = await response?.text();
  expect(html).toContain('data-christmas="true"');
  expect(html).toContain('href="/Mitzi-hero-christmas.webp"');
  expect(html).toContain('src="/Goat-avatar-christmas.webp"');
  expect(html).toContain('href="/favicon-christmas.png"');
  expect((await page.request.get("/Goat-avatar-christmas.webp")).ok()).toBe(true);
  expect((await page.request.get("/favicon-christmas.png")).ok()).toBe(true);
  expect((await goat).ok()).toBe(true);
  expect((await mitzi).ok()).toBe(true);
});
