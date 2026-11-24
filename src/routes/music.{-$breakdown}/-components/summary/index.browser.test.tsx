import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicSummary } from "./index";

test("uses the singular or plural for the average daily scrobbles", async () => {
  const user = {
    playcount: 1,
    artist_count: 0,
    album_count: 0,
    track_count: 0,
    registered: { unixtime: Date.parse("2025-01-01T00:00:00Z") / 1000 },
  };

  const asOf = Date.parse("2025-01-02T00:00:00Z");
  const result = await page.renderWithProviders(<MusicSummary user={user} asOf={asOf} />);

  await expect.element(result.getByText(/an average of 1 scrobble per day/)).toBeVisible();
  await result.rerender(<MusicSummary user={{ ...user, playcount: 2 }} asOf={asOf} />);
  await expect.element(result.getByText(/an average of 2 scrobbles per day/)).toBeVisible();
  await result.rerender(<MusicSummary user={{ ...user, playcount: 0 }} asOf={asOf} />);
  await expect.element(result.getByText(/an average of 0 scrobbles per day/)).toBeVisible();
});
