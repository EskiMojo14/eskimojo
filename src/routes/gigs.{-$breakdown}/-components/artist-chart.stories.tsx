import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { GigsArtistChart } from "./artist-chart";

import "./artist-chart.css";

const meta = preview.meta({
  title: "Gigs/Artists",
  component: GigsArtistChart,
  parameters: { layout: "padded" },
  args: { events: gigs.events },
});

export const Archive = meta.story({});
export const Empty = meta.story({
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No artists recorded yet.")).toBeVisible();
  },
});
export const MixedAppearances = meta.story({
  args: {
    events: [
      {
        artists: ["Vulfpeck"],
        support: ["Cory Wong"],
        date: "2024-12-29",
        venue: "O2 Academy Brixton",
        city: "London",
      },
      {
        artists: ["Cory Wong"],
        support: ["Joey Dosik"],
        date: "2024-01-01",
        venue: "Royal Albert Hall",
        city: "London",
      },
      { artists: ["Vulfpeck", "Cory Wong"], date: "2024-06-01", venue: "Barbican", city: "London" },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    const chart = canvas.getByRole("img", { name: "Gigs by artist" });
    chart.focus();
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByRole("heading", { name: "Cory Wong" })).toBeVisible();
    await expect(canvas.getByText("Main: 2")).toBeVisible();
    await expect(canvas.getByText("Support: 1")).toBeVisible();
    await expect(canvas.getByText("Supported Vulfpeck")).toBeVisible();
    await expect(canvas.getByText("O2 Academy Brixton, London")).toBeVisible();
    await userEvent.keyboard("{Enter}");
  },
});
