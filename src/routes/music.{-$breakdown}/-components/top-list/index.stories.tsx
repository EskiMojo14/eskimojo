import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import exampleCoverUrl from "#/routes/music.{-$breakdown}/-components/artwork/example-cover.svg?url";
import { fixturePalette } from "#/routes/music.{-$breakdown}/-components/artwork/story-fixtures";

import { MusicTopList } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

const meta = preview.meta({
  title: "Music/Top List",
  component: MusicTopList,
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Ranked music lists use Last.fm artwork; artists without images use their most popular album's cover rather than a portrait. Headline-small section headings, title-medium names, title-large ranks, body-medium artist details, and label-large play counts follow the shared theme-aware tokens. Search actions use label-medium.",
      },
    },
  },
});

export const Artists = meta.story({
  args: {
    title: "Top artists",
    kind: "artists",
    items: [
      {
        name: "Radiohead",
        rank: 1,
        playcount: 42,
        artwork: {
          imageUrl: exampleCoverUrl,
        },
        palette: fixturePalette("eskimojo"),
      },
    ],
  },
});

export const Tracks = meta.story({
  args: {
    kind: "tracks",
    title: "Top tracks",
    items: [{ name: "Let It Happen", artist: "Tame Impala", rank: 1, playcount: 1 }],
  },
});

export const Albums = meta.story({
  args: {
    title: "Top albums",
    kind: "albums",
    items: [
      {
        name: "Currents",
        artist: "Tame Impala",
        rank: 1,
        playcount: 1200,
        artwork: { imageUrl: exampleCoverUrl },
        palette: fixturePalette("eskimojo"),
      },
    ],
  },
});

export const Empty = meta.story({
  args: { title: "Top tracks", kind: "tracks", items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "No listening data for this period." }),
    ).toBeVisible();
    await expect(canvas.getByText("Try choosing a different time period.")).toBeVisible();
    await expect(canvas.queryByRole("list")).not.toBeInTheDocument();
  },
});

export const NarrowTracks = meta.story({
  args: {
    kind: "tracks",
    title: "Top tracks",
    items: [{ name: "Lost Chapter", artist: "Pentakill", rank: 1, playcount: 290 }],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "Narrow lists put play counts below the title details and search links in a full-width row, preserving room for names and touch targets.",
      },
    },
  },
});

export const NarrowArtists = meta.story({
  args: {
    kind: "artists",
    title: "Top artists",
    items: [{ name: "Scary Pockets", rank: 1, playcount: 4794 }],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
});
