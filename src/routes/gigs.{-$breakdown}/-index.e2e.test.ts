import { createTest, expect } from "#test/e2e";

import { GigsPage } from "./-index.e2e.model";

const test = createTest({ gigs: GigsPage });

test.beforeEach(async ({ fontsLoaded }) => {
  await fontsLoaded();
});

test("navigates between gig breakdowns and updates the selected tab", async ({ gigs }) => {
  await gigs.goto();

  await gigs.artist.select();
  await expect(gigs.artist.region).toBeVisible();
  await gigs.venue.select();
  await expect(gigs.venue.region).toBeVisible();
  await gigs.city.select();
  await expect(gigs.city.region).toBeVisible();
  await expect(gigs.city.map).toBeVisible();
  await gigs.month.select();
  await expect(gigs.month.region).toBeVisible();
});

test("loads a gig breakdown directly from its URL", async ({ page, gigs }) => {
  await page.goto("/gigs/by-city");

  await expect(page).toHaveTitle(gigs.title);
  await expect(gigs.city.tabLink).toHaveAttribute("aria-selected", "true");
  await expect(gigs.city.tabPanel).toBeVisible();
  await expect(gigs.city.map).toBeVisible();
});
