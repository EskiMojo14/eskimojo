import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { RecentTracks } from "./recent-tracks";

test("renders now playing and repeated completed tracks with semantic timestamps", async () => {
  const track = {
    name: "Let It Happen",
    artist: "Tame Impala",
    album: "Currents",
    image: {},
  };
  const result = await page.renderWithProviders(
    <RecentTracks
      tracks={[
        { ...track, nowPlaying: true },
        { ...track, nowPlaying: false, date: "2026-10-26T00:55:00.000Z" },
        { ...track, nowPlaying: false, date: "2026-10-26T00:50:00.000Z" },
      ]}
    />,
  );
  await expect.element(result.getByRole("region", { name: "Recently played" })).toBeVisible();
  expect(result.getByRole("listitem").all()).toHaveLength(3);
  await expect.element(result.getByText("Now playing")).toBeVisible();
  await expect
    .element(result.getByText("26 Oct 2026, 00:55 UTC"))
    .toHaveAttribute("datetime", "2026-10-26T00:55:00.000Z");
});

test("shows an explicit empty state instead of an empty list", async () => {
  const result = await page.renderWithProviders(<RecentTracks tracks={[]} />);
  await expect.element(result.getByText("No recently played tracks yet.")).toBeVisible();
  expect(result.getByRole("list").query()).toBeNull();
});
