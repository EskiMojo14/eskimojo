import preview from "#.storybook/preview";

import { MusicSearchLinks } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

const meta = preview.meta({
  title: "Music/Search Links",
  component: MusicSearchLinks,
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Spotify links open the matched catalog item when available and otherwise search by item name. YouTube links search for the item; both open in a new tab.",
      },
    },
  },
});

export const Track = meta.story({ args: { name: "Let It Happen", artist: "Tame Impala" } });
export const Artist = meta.story({ args: { name: "Radiohead" } });
