import preview from "#.storybook/preview";

import { MusicTopList } from "./top-list";

import "./recent-tracks.css";

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
