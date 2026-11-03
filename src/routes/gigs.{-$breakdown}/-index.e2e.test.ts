import { createTest, expect } from "#test/e2e";

import { GigsPage } from "./-index.e2e.model";

const test = createTest({ gigs: GigsPage });

test.beforeEach(async ({ fontsLoaded }) => {
  await fontsLoaded();
});

test("navigates between gig breakdowns and updates the selected tab", async ({ gigs }) => {
  await gigs.goto();

  await gigs.artist.select();
  await expect.locator(gigs.artist.heading).toBeVisible();
  await gigs.venue.select();
  await expect.locator(gigs.venue.heading).toBeVisible();
  await gigs.city.select();
  await expect.locator(gigs.city.map).toBeVisible();
  await gigs.month.select();
  await expect.locator(gigs.month.heading).toBeVisible();
});

test("loads a gig breakdown directly from its URL", async ({ page, gigs }) => {
  await page.goto("/gigs/by-city");

  await expect.page(page).toHaveTitle("Gigs | eskimojo");
  await expect.locator(gigs.city.tabLink).toHaveAttribute("aria-selected", "true");
  await expect.locator(gigs.city.tabPanel).toBeVisible();
  await expect.locator(gigs.city.map).toBeVisible();
});
