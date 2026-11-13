import { expect, waitFor } from "storybook/test";

import preview from "#.storybook/preview";
import exampleCoverUrl from "#/routes/music.{-$breakdown}/-components/artwork/example-cover.svg?url";
import { fixturePalette } from "#/routes/music.{-$breakdown}/-components/artwork/story-fixtures";
import type { RecentTrack } from "#/routes/music.{-$breakdown}/-query.ts";

import { RecentTracks, RecentTracksSkeleton } from "./index";

import "./index.css";
import "#/routes/music.{-$breakdown}/-components/skeletons/index.css";

const tracks: Array<RecentTrack> = [
  {
    name: "Let It Happen",
    artist: "Tame Impala",
    album: "Currents",
    artwork: {
      imageUrl: exampleCoverUrl,
      spotifyUrl: "https://open.spotify.com/track/let-it-happen",
    },
    palette: fixturePalette("eskimojo"),
    nowPlaying: true,
  },
  {
    name: "Everything In Its Right Place",
    artist: "Radiohead",
    album: "Kid A",
    nowPlaying: false,
    date: "2026-10-26T00:55:00.000Z",
  },
];

const meta = preview.meta({
  title: "Music/Recent Tracks",
  component: RecentTracks,
  args: { tracks },
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Recent Last.fm tracks use Spotify-matched cover art. Each row receives a server-generated cover-art palette for its surface, text, links, and now-playing accent, respecting light/dark and all contrast settings. Missing artwork or failed image loads use the icon fallback. Stories reuse build-generated image palettes without loading the decoder in the browser. Headline-small headings and title-medium track names lead the hierarchy; artist details use body-medium, timestamps body-small, and status/search actions label-medium. Artwork is decorative, missing artwork uses a music symbol, and now-playing tracks have no timestamp. The decorative five-bar equalizer uses spatial springs through a closed sequence of heights, with independent cycle lengths and phases to avoid a synchronized restart. Bar positions and widths match Material Symbols Sharp graphic_eq at 24px; reduced motion restores its exact static geometry. The visible Now playing label conveys status without motion. Completed plays use explicit UTC timestamps for consistent server and client rendering. Styles load through the music route's head-linked stylesheet.",
      },
    },
  },
});

export const Recent = meta.story({
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole("heading", { name: "Recently played" })).toBeVisible();
    });
    await expect(canvas.getByText("Now playing")).toBeVisible();
    await expect(canvas.getByText("26 Oct 2026, 00:55 UTC")).toBeVisible();
  },
});

export const Empty = meta.story({
  args: { tracks: [] },
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(
        canvas.getByRole("heading", { name: "No recently played tracks yet." }),
      ).toBeVisible();
    });
    await expect(
      canvas.getByText("Your recently played tracks will appear here once you start listening."),
    ).toBeVisible();
  },
});

export const MissingArtwork = meta.story({
  args: {
    tracks: [
      {
        name: "Mama Say",
        artist: "Vulfmon",
        album: "Mama Say",
        nowPlaying: true,
      },
    ],
  },
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("Mama Say", { exact: true })).toBeVisible();
    });
    await expect(canvas.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
    await expect(canvas.getByText("Now playing")).toBeVisible();
  },
});

export const FailedArtwork = meta.story({
  args: {
    tracks: [
      {
        name: "Unavailable cover",
        artist: "Example artist",
        album: "Example album",
        artwork: {
          imageUrl: "data:image/png;base64,bm90LWFuLWltYWdl",
          spotifyUrl: "https://open.spotify.com/track/unavailable-cover",
        },
        nowPlaying: true,
      },
    ],
  },
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("music_note")).toBeVisible();
    });
    await expect(canvas.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
  },
});

const coverTracks: Array<RecentTrack> = [
  ...tracks.slice(0, 1),
  {
    name: "Another cover palette",
    artist: "Example artist",
    album: "Example album",
    artwork: {
      imageUrl: exampleCoverUrl,
      spotifyUrl: "https://open.spotify.com/track/example",
    },
    palette: fixturePalette("redux"),
    nowPlaying: false,
    date: "2026-10-26T00:55:00.000Z",
  },
];

export const CoverPalettes = meta.story({
  args: { tracks: coverTracks },
});

export const CoverPalettesDark = meta.story({
  args: { tracks: coverTracks },
  globals: { theme: "dark", contrast: "high" },
});

export const NarrowNowPlaying = meta.story({
  args: {
    tracks: [
      {
        name: "Would I Lie to You?",
        artist: "Charles & Eddie",
        album: "Duophonic",
        artwork: {
          imageUrl: exampleCoverUrl,
          spotifyUrl: "https://open.spotify.com/track/would-i-lie-to-you",
        },
        palette: fixturePalette("eskimojo"),
        nowPlaying: true,
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
});

export const LongContent = meta.story({
  args: {
    tracks: [
      {
        name: "A track with a very long title that wraps without hiding the rest of the listening history",
        artist: "An artist with a long name",
        album: "",
        nowPlaying: false,
        date: "2026-10-25T23:30:00.000Z",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
});

export const Loading = meta.story({
  render: () => <RecentTracksSkeleton />,
  parameters: {
    docs: {
      description: {
        story:
          "Ten placeholder rows share the loaded list structure. Artwork, text, timestamps, and inert search-action placeholders pulse subtly; reduced motion keeps them static. Only the named progress element is exposed to assistive technology.",
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar")).toHaveAccessibleName("Loading recent tracks...");
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
  },
});
