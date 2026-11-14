import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicTopMusic } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

const tracks = [
  {
    name: "Let It Happen",
    artist: "Tame Impala",
    rank: 1,
    playcount: 42,
    artwork: { imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/currents" },
  },
];
const artists = [
  {
    name: "Radiohead",
    rank: 1,
    playcount: 42,
    artwork: { imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/radiohead-album" },
  },
];
const albums = [
  {
    name: "Currents",
    artist: "Tame Impala",
    rank: 1,
    playcount: 200,
    artwork: { imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/album-cover" },
  },
];

test("infers the selected ranking from the supplied prop, including empty rankings", async () => {
  const result = await page.renderWithProviders(<MusicTopMusic tracks={[]} />);
  await expect.element(result.getByRole("region", { name: "Top tracks" })).toBeVisible();
  await expect
    .element(result.getByText("No listening data for this period.").first())
    .toBeVisible();
  await result.rerender(
    <MusicTopMusic artists={[{ name: "Radiohead", rank: 1, playcount: 42 }]} />,
  );
  await expect.element(result.getByText("Radiohead")).toBeVisible();
  await expect
    .element(
      result
        .getByRole("region", { name: "Top artists" })
        .getByText("No listening data for this period."),
    )
    .not.toBeInTheDocument();
  await result.rerender(<MusicTopMusic albums={[]} />);
  await expect.element(result.getByRole("region", { name: "Top albums" })).toBeVisible();
  await expect
    .element(
      result
        .getByRole("region", { name: "Top albums" })
        .getByText("No listening data for this period."),
    )
    .toBeVisible();
  await result.rerender(<MusicTopMusic artists={[]} />);
  await expect.element(result.getByRole("region", { name: "Top artists" })).toBeVisible();
  await expect
    .element(
      result
        .getByRole("region", { name: "Top artists" })
        .getByText("No listening data for this period."),
    )
    .toBeVisible();
});

test("shows Last.fm track and artist album artwork with search links", async () => {
  const image = Uint8Array.from(
    atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
    (char) => char.charCodeAt(0),
  );
  network.use(
    http.get(
      "https://lastfm.freetls.fastly.net/i/u/300x300/*",
      () => new HttpResponse(image, { headers: { "Content-Type": "image/gif" } }),
    ),
  );
  const result = await page.renderWithProviders(<MusicTopMusic tracks={tracks} />);
  await expect
    .element(result.getByRole("link", { name: "Search Spotify for Let It Happen Tame Impala" }))
    .toHaveAttribute("href", "https://open.spotify.com/search/Let%20It%20Happen%20Tame%20Impala");
  await expect
    .element(result.getByAltText("").first())
    .toHaveAttribute("src", "https://lastfm.freetls.fastly.net/i/u/300x300/currents");
  await result.rerender(<MusicTopMusic albums={albums} />);
  await expect.element(result.getByRole("region", { name: "Top albums" })).toBeVisible();
  await expect
    .element(result.getByRole("link", { name: "Search Spotify for Currents Tame Impala" }))
    .toHaveAttribute("href", "https://open.spotify.com/search/Currents%20Tame%20Impala");
  await expect
    .element(result.getByRole("link", { name: "Search YouTube for Currents Tame Impala" }))
    .toHaveAttribute(
      "href",
      "https://www.youtube.com/results?search_query=Currents%20Tame%20Impala",
    );
  await expect
    .element(result.getByRole("region", { name: "Top albums" }).getByAltText(""))
    .toHaveAttribute("src", "https://lastfm.freetls.fastly.net/i/u/300x300/album-cover");
  await result.rerender(<MusicTopMusic artists={artists} />);
  await expect
    .element(result.getByRole("link", { name: "Search Spotify for Radiohead" }))
    .toHaveAttribute("href", "https://open.spotify.com/search/Radiohead");
  await expect
    .element(result.getByAltText("").last())
    .toHaveAttribute("src", "https://lastfm.freetls.fastly.net/i/u/300x300/radiohead-album");
});

test("falls back to each item's icon when Last.fm artwork fails to load", async () => {
  const brokenArtwork = {
    imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/missing-cover",
  };
  network.use(
    http.get(
      "https://lastfm.freetls.fastly.net/i/u/300x300/*",
      () => new HttpResponse(null, { status: 404 }),
    ),
  );
  const result = await page.renderWithProviders(
    <MusicTopMusic tracks={tracks.map((track) => ({ ...track, artwork: brokenArtwork }))} />,
  );
  await expect.element(result.getByText("music_note")).toBeVisible();
  await result.rerender(
    <MusicTopMusic albums={albums.map((album) => ({ ...album, artwork: brokenArtwork }))} />,
  );
  await expect.element(result.getByText("album")).toBeVisible();
  await result.rerender(
    <MusicTopMusic artists={artists.map((artist) => ({ ...artist, artwork: brokenArtwork }))} />,
  );
  await expect.element(result.getByText("artist")).toBeVisible();
  expect(result.getByAltText("").all()).toHaveLength(0);
});
