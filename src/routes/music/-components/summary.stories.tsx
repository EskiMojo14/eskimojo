import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { MusicSummary } from "./summary";

import "./summary.css";

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
    await expect(canvas.getByText("163,572")).toBeVisible();
    await expect(canvas.getByText("6,047")).toBeVisible();
    await expect(canvas.getByText("22 Sept 2017")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Last.fm" })).toHaveAttribute(
      "href",
      "https://www.last.fm",
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
  play: async ({ canvas }) => {
    const cards = canvas.getAllByRole("definition").map((element) => {
      const card = element.parentElement;
      if (!card) throw new Error("Statistic must have a card container");
      return card.getBoundingClientRect();
    });
    await expect(cards[0].top).toBe(cards[1].top);
    await expect(cards[2].top).toBe(cards[3].top);
    await expect(cards[2].top).toBeGreaterThan(cards[0].top);
  },
});
