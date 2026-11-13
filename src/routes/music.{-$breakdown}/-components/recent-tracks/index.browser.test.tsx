import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { RecentTracks } from "./index";

function mockSpotifyArtwork() {
  network.use(
    http.get(
      "https://i.scdn.co/image/*",
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

test("shows matched Spotify artwork and links directly to the matched track", async () => {
  mockSpotifyArtwork();
  const result = await page.renderWithProviders(
    <RecentTracks
      tracks={[
        {
          name: "Let It Happen",
          artist: "Tame Impala",
          album: "Currents",
          artwork: {
            imageUrl: "https://i.scdn.co/image/currents",
            spotifyUrl: "https://open.spotify.com/track/let-it-happen",
          },
          nowPlaying: true,
        },
      ]}
    />,
  );
  await expect
    .element(result.getByAltText(""))
    .toHaveAttribute("src", "https://i.scdn.co/image/currents");
  await expect
    .element(result.getByRole("link", { name: "Open Let It Happen Tame Impala on Spotify" }))
    .toHaveAttribute("href", "https://open.spotify.com/track/let-it-happen");
});

test("shows an explicit empty state instead of an empty list", async () => {
  const result = await page.renderWithProviders(<RecentTracks tracks={[]} />);
  await expect.element(result.getByText("No recently played tracks yet.")).toBeVisible();
  expect(result.getByRole("list").query()).toBeNull();
});
