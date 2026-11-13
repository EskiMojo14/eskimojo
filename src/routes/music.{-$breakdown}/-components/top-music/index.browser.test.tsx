import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicTopMusic } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

function mockSpotifyArtwork() {
  network.use(
    http.get(
      "https://i.scdn.co/image/*",
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

test("shows matched Spotify track and artist artwork with direct links", async () => {
  mockSpotifyArtwork();
  const result = await page.renderWithProviders(
    <MusicTopMusic
      tracks={[
        {
          name: "Let It Happen",
          artist: "Tame Impala",
          rank: 1,
          playcount: 42,
          artwork: {
            imageUrl: "https://i.scdn.co/image/currents",
            spotifyUrl: "https://open.spotify.com/track/let-it-happen",
          },
        },
      ]}
      artists={[
        {
          name: "Radiohead",
          rank: 1,
          playcount: 42,
          artwork: {
            imageUrl: "https://i.scdn.co/image/radiohead",
            spotifyUrl: "https://open.spotify.com/artist/radiohead",
          },
        },
      ]}
    />,
  );

  await expect
    .element(result.getByRole("link", { name: "Open Let It Happen Tame Impala on Spotify" }))
    .toHaveAttribute("href", "https://open.spotify.com/track/let-it-happen");
  await expect
    .element(result.getByRole("link", { name: "Open Radiohead on Spotify" }))
    .toHaveAttribute("href", "https://open.spotify.com/artist/radiohead");
  expect(result.getByAltText("").all()).toHaveLength(2);
});
