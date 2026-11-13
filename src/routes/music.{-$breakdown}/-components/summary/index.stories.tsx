import { expect, waitFor } from "storybook/test";

import preview from "#.storybook/preview";
import { assert } from "#/utils";

import { MusicSummary, MusicSummarySkeleton } from "./index";

import "./index.css";
import "#/routes/music.{-$breakdown}/-components/skeletons/index.css";

const meta = preview.meta({
  title: "Music/Summary",
  component: MusicSummary,
  parameters: { layout: "padded", a11y: { test: "error" } },
  args: {
    user: {
      playcount: 163572,
      artist_count: 6047,
      album_count: 15034,
      track_count: 22734,
      registered: { unixtime: Date.parse("2017-09-22T00:00:00Z") / 1000 },
    },
    asOf: Date.parse("2026-10-26T00:00:00Z"),
  },
});

export const Statistics = meta.story({
  play: async ({ canvas }) => {
    const counts = canvas.getAllByRole("definition");
    const [playCount, artistCount] = counts;
    assert(playCount && artistCount, "Expected listening and artist statistics.");
    await waitFor(async () => {
      await expect(playCount.lastElementChild).toHaveTextContent("163,572");
      await expect(artistCount.lastElementChild).toHaveTextContent("6,047");
    });
    await expect(canvas.getByText("22 Sept 2017")).toBeVisible();
  },
});

export const AnimatedCounts = meta.story({
  render: (args) => (
    <div style={{ "--md-sys-motion-spring-default-effects-duration": "1000ms" }}>
      <MusicSummary {...args} />
    </div>
  ),
  play: async ({ canvas, args }) => {
    const counts = canvas.getAllByRole("definition");
    const targets = [
      args.user.playcount,
      args.user.artist_count,
      args.user.album_count,
      args.user.track_count,
    ] as const;
    assert(
      counts.length === targets.length,
      `Expected ${targets.length} listening statistics, received ${counts.length}.`,
    );
    let previous = targets.map((target) => Math.ceil(target * 0.95));
    const readCounts = () =>
      counts.map((count) => Number(count.lastElementChild?.textContent?.replaceAll(",", "")));
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const initialPlayCount = readCounts()[0];
      assert(initialPlayCount !== undefined, "Expected an initial play count.");
      await expect(initialPlayCount).toBeLessThan(targets[0]);
    }
    await waitFor(
      async () => {
        const current = readCounts();
        for (const [index, target] of targets.entries()) {
          const value = current[index];
          const previousValue = previous[index];
          const count = counts[index];
          assert(
            value !== undefined && previousValue !== undefined && count,
            `Missing listening statistic at index ${index}.`,
          );
          await expect(value).toBeGreaterThanOrEqual(previousValue);
          await expect(value).toBeLessThanOrEqual(target);
          await expect(count.firstElementChild).toHaveTextContent(target.toLocaleString("en-GB"));
          await expect(count.lastElementChild).toHaveAttribute("aria-hidden", "true");
        }
        previous = current;
        await expect(current).toEqual(targets);
      },
      { timeout: 2000 },
    );
  },
});

export const NewListener = meta.story({
  args: {
    user: {
      playcount: 0,
      artist_count: 0,
      album_count: 0,
      track_count: 0,
      registered: { unixtime: Date.parse("2026-10-26T00:00:00Z") / 1000 },
    },
  },
});

export const BalancedRows = meta.story({
  render: (args) => (
    <div style={{ inlineSize: "42rem" }}>
      <MusicSummary {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  render: () => <MusicSummarySkeleton />,
  parameters: {
    docs: {
      description: {
        story:
          "Material 3 skeleton loading preserves the shared summary layout. Neutral surface placeholders pulse subtly, remain static with reduced motion, and expose one named indeterminate progress element instead of placeholder statistics.",
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar")).toHaveAccessibleName(
      "Loading listening summary...",
    );
    await expect(canvas.queryByRole("definition")).not.toBeInTheDocument();
  },
});
