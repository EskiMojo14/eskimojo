import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import type { RecentTrack } from "#/routes/music.{-$breakdown}/-query.ts";

import { RecentTracks } from "./index";

import "./index.css";

const tracks: Array<RecentTrack> = [
  {
    name: "Let It Happen",
    artist: "Tame Impala",
    album: "Currents",
    image: { large: "/Goat_square-1.jpeg" },
    nowPlaying: true,
  },
  {
    name: "Everything In Its Right Place",
    artist: "Radiohead",
    album: "Kid A",
    image: {},
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
          "Recent Last.fm tracks in the default expressive list. Headline-small headings and title-medium track names lead the hierarchy; artist details use body-medium, timestamps body-small, and status/search actions label-medium. Artwork is decorative, missing artwork uses a music symbol, and now-playing tracks have no timestamp. The decorative five-bar equalizer uses spatial springs through a closed sequence of heights, with independent cycle lengths and phases to avoid a synchronized restart. Bar positions and widths match Material Symbols Sharp graphic_eq at 24px; reduced motion restores its exact static geometry. The visible Now playing label conveys status without motion. Completed plays use explicit UTC timestamps for consistent server and client rendering. Styles load through the music route's head-linked stylesheet.",
      },
    },
  },
});

export const Recent = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Recently played" })).toBeVisible();
    await expect(canvas.getByText("Now playing")).toBeVisible();
    await expect(canvas.getByText("26 Oct 2026, 00:55 UTC")).toBeVisible();
  },
});

export const Empty = meta.story({
  args: { tracks: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No recently played tracks yet.")).toBeVisible();
  },
});

export const NarrowNowPlaying = meta.story({
  args: {
    tracks: [
      {
        name: "Would I Lie to You?",
        artist: "Charles & Eddie",
        album: "Duophonic",
        image: { large: "/Goat_square-1.jpeg" },
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
        image: { large: "" },
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
