import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { MusicTopMusic, MusicTopMusicSkeleton } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";
import "#/routes/music.{-$breakdown}/-components/skeletons/index.css";

const meta = preview.meta({
  title: "Music/Top Music",
  component: MusicTopMusic,
  args: {
    tracks: [
      { name: "Lost Chapter", artist: "Pentakill", rank: 1, playcount: 290, image: {} },
      { name: "Let It Happen", artist: "Tame Impala", rank: 2, playcount: 200, image: {} },
    ],
    artists: [
      { name: "Scary Pockets", rank: 1, playcount: 4794, image: {} },
      { name: "Radiohead", rank: 2, playcount: 4000, image: {} },
    ],
  },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Top tracks and artists for the same listening period. Tracks come first in reading and keyboard order. The lists share a row when there is room for two 28rem columns; otherwise they stack. Each list's rows adapt independently to their container width.",
      },
    },
  },
});

export const Wide = meta.story({
  parameters: {
    viewport: {
      options: {
        desktop: { name: "Desktop", styles: { width: "1200px", height: "900px" } },
      },
    },
  },
  globals: { viewport: { value: "desktop", isRotated: false } },
});

export const Mobile = meta.story({
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "mobile", isRotated: false } },
});

export const Empty = meta.story({ args: { tracks: [], artists: [] } });

export const Loading = meta.story({
  render: () => <MusicTopMusicSkeleton />,
  parameters: {
    docs: {
      description: {
        story:
          "Track and artist skeletons reuse the loaded responsive columns and ranked rows. Neutral placeholders pulse with staggered timing, remain static with reduced motion, and contain no interactive controls. One named progress element describes the combined loading state.",
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar")).toHaveAccessibleName("Loading top music...");
    await expect(canvas.queryByRole("list")).not.toBeInTheDocument();
  },
});
