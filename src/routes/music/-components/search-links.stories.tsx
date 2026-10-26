import preview from "#.storybook/preview";

import { MusicSearchLinks } from "./search-links";

import "./recent-tracks.css";

const meta = preview.meta({
  title: "Music/Search Links",
  component: MusicSearchLinks,
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Native Spotify and YouTube search links. Track searches include the artist; artist searches use the name alone. Destinations are URL-encoded and open in the current tab.",
      },
    },
  },
});

export const Track = meta.story({ args: { name: "Let It Happen", artist: "Tame Impala" } });
export const Artist = meta.story({ args: { name: "Radiohead" } });
