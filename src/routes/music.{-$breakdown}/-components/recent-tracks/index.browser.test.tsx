import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { RecentTracks } from "./index";

function mockLastfmArtwork() {
  network.use(
    http.get(
      "https://lastfm.freetls.fastly.net/i/u/300x300/*",
      () => new HttpResponse(null, { status: 200, headers: { "Content-Type": "image/png" } }),
    ),
  );
}

test("renders now playing and repeated completed tracks with semantic timestamps", async () => {
  const track = {
    name: "Let It Happen",
    artist: "Tame Impala",
    album: "Currents",
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

test("shows Last.fm artwork and preserves music search links", async () => {
  mockLastfmArtwork();
  const result = await page.renderWithProviders(
    <RecentTracks
      tracks={[
        {
          name: "Let It Happen",
          artist: "Tame Impala",
          album: "Currents",
          artwork: {
            imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/currents",
          },
          nowPlaying: true,
        },
      ]}
    />,
  );
  await expect
    .element(result.getByAltText(""))
    .toHaveAttribute("src", "https://lastfm.freetls.fastly.net/i/u/300x300/currents");
  await expect
    .element(result.getByRole("link", { name: "Search Spotify for Let It Happen Tame Impala" }))
    .toHaveAttribute("href", "https://open.spotify.com/search/Let%20It%20Happen%20Tame%20Impala");
});

test("shows an explicit empty state instead of an empty list", async () => {
  const result = await page.renderWithProviders(<RecentTracks tracks={[]} />);
  await expect.element(result.getByText("No recently played tracks yet.")).toBeVisible();
  expect(result.getByRole("list").query()).toBeNull();
});
