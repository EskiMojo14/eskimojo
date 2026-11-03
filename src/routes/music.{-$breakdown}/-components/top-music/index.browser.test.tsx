import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicTopMusic } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

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
