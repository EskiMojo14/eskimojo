import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicTopMusic } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

test.each([320, 390, 800, 1200])(
  "lays out both top lists without overflow at %i px",
  async (width) => {
    const result = await page.renderWithProviders(
      <div style={{ width }}>
        <MusicTopMusic
          tracks={[
            { name: "Lost Chapter", artist: "Pentakill", rank: 1, playcount: 290, image: {} },
          ]}
          artists={[{ name: "Scary Pockets", rank: 1, playcount: 4794, image: {} }]}
        />
      </div>,
    );
    const tracks = result.getByRole("region", { name: "Top tracks" }).element();
    const artists = result.getByRole("region", { name: "Top artists" }).element();
    const trackBounds = tracks.getBoundingClientRect();
    const artistBounds = artists.getBoundingClientRect();
    const sideBySide = width >= 896;
    expect(sideBySide ? trackBounds.top : trackBounds.left).toBeCloseTo(
      sideBySide ? artistBounds.top : artistBounds.left,
      0,
    );
    expect(sideBySide ? artistBounds.left : artistBounds.top).toBeGreaterThanOrEqual(
      sideBySide ? trackBounds.right : trackBounds.bottom,
    );
    expect(tracks.scrollWidth).toBeLessThanOrEqual(tracks.clientWidth);
    expect(artists.scrollWidth).toBeLessThanOrEqual(artists.clientWidth);
    expect(trackBounds.width).toBeGreaterThanOrEqual(Math.min(width, 448));
  },
);

test("keeps both sections visible when one ranking is empty", async () => {
  const result = await page.renderWithProviders(
    <MusicTopMusic
      tracks={[]}
      artists={[{ name: "Radiohead", rank: 1, playcount: 42, image: {} }]}
    />,
  );
  await expect
    .element(
      result
        .getByRole("region", { name: "Top tracks" })
        .getByText("No listening data for this period."),
    )
    .toBeVisible();
  await expect.element(result.getByText("Radiohead")).toBeVisible();
});
