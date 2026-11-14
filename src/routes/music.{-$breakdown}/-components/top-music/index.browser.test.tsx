import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicTopMusic } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

function mockLastfmArtwork() {
  network.use(
    http.get(
      "https://lastfm.freetls.fastly.net/i/u/300x300/*",
      () => new HttpResponse(null, { status: 200, headers: { "Content-Type": "image/png" } }),
    ),
  );
}

test("keeps both sections visible when one ranking is empty", async () => {
  const result = await page.renderWithProviders(
    <MusicTopMusic tracks={[]} artists={[{ name: "Radiohead", rank: 1, playcount: 42 }]} />,
  );
  await expect
    .element(
      result
        .getByRole("region", { name: "Top tracks" })
        .getByText("No listening data for this period."),
    )
    .toBeVisible();
  await expect.element(result.getByText("Radiohead")).toBeVisible();
});

test("shows Last.fm track and artist album artwork with search links", async () => {
  mockLastfmArtwork();
  const result = await page.renderWithProviders(
    <MusicTopMusic
      tracks={[
        {
          name: "Let It Happen",
          artist: "Tame Impala",
          rank: 1,
          playcount: 42,
          artwork: {
            imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/currents",
          },
        },
      ]}
      artists={[
        {
          name: "Radiohead",
          rank: 1,
          playcount: 42,
          artwork: {
            imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/radiohead-album",
          },
        },
      ]}
    />,
  );

  await expect
    .element(result.getByRole("link", { name: "Search Spotify for Let It Happen Tame Impala" }))
    .toHaveAttribute("href", "https://open.spotify.com/search/Let%20It%20Happen%20Tame%20Impala");
  await expect
    .element(result.getByRole("link", { name: "Search Spotify for Radiohead" }))
    .toHaveAttribute("href", "https://open.spotify.com/search/Radiohead");
  expect(result.getByAltText("").all()).toHaveLength(2);
});

test("falls back to each item's icon when Last.fm artwork fails to load", async () => {
  network.use(
    http.get(
      "https://lastfm.freetls.fastly.net/i/u/300x300/*",
      () => new HttpResponse(null, { status: 404 }),
    ),
  );
  const result = await page.renderWithProviders(
    <MusicTopMusic
      tracks={[
        {
          name: "Let It Happen",
          artist: "Tame Impala",
          rank: 1,
          playcount: 42,
          artwork: {
            imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/missing-track",
          },
        },
      ]}
      artists={[
        {
          name: "Radiohead",
          rank: 1,
          playcount: 42,
          artwork: {
            imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/missing-artist",
          },
        },
      ]}
    />,
  );

  await expect.element(result.getByText("music_note")).toBeVisible();
  await expect.element(result.getByText("artist")).toBeVisible();
  expect(result.getByAltText("").all()).toHaveLength(0);
});
