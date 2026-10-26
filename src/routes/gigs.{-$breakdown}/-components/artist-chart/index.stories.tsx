import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { GigsArtistChart } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Gigs/Artists",
  component: GigsArtistChart,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Chart tooltips share a typography hierarchy across artist, venue, city, and month views: MD3 title-small subheaders in on-surface-variant, label-large counts, title-small event names/dates, and body-small details. The tooltip--chart modifier styles the chart details without overriding the standard rich-tooltip subheader.",
      },
    },
  },
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
    await expect(canvas.getByText("1 Jun 2024", { exact: true })).toBeVisible();
    await expect(canvas.getByText("29 Dec 2024", { exact: true })).not.toBeInTheDocument();

    const supportBar = chart.querySelectorAll("rect")[1];
    if (!supportBar) throw new Error("Expected the first artist to have a support bar.");
    await userEvent.hover(supportBar);
    await expect(canvas.getByText("Support: 1")).toBeVisible();
    await expect(canvas.getByText("Supported Vulfpeck")).toBeVisible();
    await expect(canvas.getByText("29 Dec 2024", { exact: true })).toBeVisible();
    await expect(canvas.getByText("Main: 2")).not.toBeInTheDocument();
    await expect(canvas.getByText("1 Jun 2024", { exact: true })).not.toBeInTheDocument();
  },
});
