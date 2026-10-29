import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import {
  MusicSummary,
  MusicSummarySkeleton,
} from "#/routes/music.{-$breakdown}/-components/summary";
import {
  MusicTopMusic,
  MusicTopMusicSkeleton,
} from "#/routes/music.{-$breakdown}/-components/top-music";

import "./index.css";
import "#/routes/music.{-$breakdown}/-components/summary/index.css";
import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

test.each([320, 1200])(
  "summary skeleton reserves the loaded card grid and text height at %i px",
  async (width) => {
    const result = await page.renderWithProviders(
      <div style={{ width }}>
        <MusicSummarySkeleton />
        <MusicSummary
          user={{
            playcount: 163572,
            artist_count: 6047,
            album_count: 15034,
            track_count: 22734,
            registered: { unixtime: Date.parse("2017-09-22T00:00:00Z") / 1000 },
          }}
          asOf={Date.parse("2026-10-26T00:00:00Z")}
        />
      </div>,
    );
    const skeleton = result.getByRole("progressbar").element().nextElementSibling;
    if (!skeleton) throw new Error("Missing summary skeleton");
    const loaded = result.getByRole("region", { name: "Listening statistics" }).element();
    expect(skeleton.getBoundingClientRect().height).toBe(loaded.getBoundingClientRect().height);
    expect(skeleton.scrollWidth).toBeLessThanOrEqual(skeleton.clientWidth);
    await expect.element(result.getByRole("progressbar")).not.toHaveAttribute("value");
  },
);

test.each([320, 1200])(
  "top-music skeleton matches loaded column and row geometry at %i px",
  async (width) => {
    const result = await page.renderWithProviders(
      <div style={{ width }}>
        <MusicTopMusicSkeleton />
        <MusicTopMusic
          tracks={[
            { name: "Lost Chapter", artist: "Pentakill", rank: 1, playcount: 290, image: {} },
          ]}
          artists={[{ name: "Scary Pockets", rank: 1, playcount: 4794, image: {} }]}
        />
      </div>,
    );
    const skeleton = result.getByRole("progressbar").element().nextElementSibling;
    if (!skeleton) throw new Error("Missing top-music skeleton");
    for (const [index, title] of ["Top tracks", "Top artists"].entries()) {
      const panel = skeleton.children[index];
      const loaded = result.getByRole("region", { name: title }).element();
      const placeholderRows = panel.querySelectorAll("li");
      const loadedRow = loaded.querySelector("li");
      if (!loadedRow) throw new Error("Missing loaded music row");
      expect(placeholderRows).toHaveLength(10);
      expect(panel.getBoundingClientRect().width).toBe(loaded.getBoundingClientRect().width);
      expect(panel.getBoundingClientRect().left).toBe(loaded.getBoundingClientRect().left);
      expect(placeholderRows[0].getBoundingClientRect().height).toBe(
        loadedRow.getBoundingClientRect().height,
      );
      expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth);
    }
    await expect
      .element(result.getByRole("progressbar"))
      .toHaveAccessibleName("Loading top music...");
  },
);
