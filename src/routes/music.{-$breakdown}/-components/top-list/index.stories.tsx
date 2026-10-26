import preview from "#.storybook/preview";

import { MusicTopList } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

const meta = preview.meta({
  title: "Music/Top List",
  component: MusicTopList,
  parameters: { layout: "padded", a11y: { test: "error" } },
});

export const Artists = meta.story({
  args: {
    title: "Top artists",
    items: [{ name: "Radiohead", rank: 1, playcount: 42, image: {} }],
  },
});

export const Tracks = meta.story({
  args: {
    title: "Top tracks",
    items: [{ name: "Let It Happen", artist: "Tame Impala", rank: 1, playcount: 1, image: {} }],
  },
});

export const Empty = meta.story({
  args: { title: "Top tracks", items: [] },
});

export const NarrowTracks = meta.story({
  args: {
    title: "Top tracks",
    items: [{ name: "Lost Chapter", artist: "Pentakill", rank: 1, playcount: 290, image: {} }],
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
    title: "Top artists",
    items: [{ name: "Scary Pockets", rank: 1, playcount: 4794, image: {} }],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
});
