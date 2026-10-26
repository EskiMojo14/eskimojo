import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { GigsVenueChart } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Gigs/Venues",
  component: GigsVenueChart,
  parameters: { layout: "padded" },
  args: { events: gigs.events },
});

export const Archive = meta.story({});
export const Empty = meta.story({
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No venues recorded yet.")).toBeVisible();
  },
});
export const VenueEvents = meta.story({
  args: {
    events: [
      {
        artists: ["Vulfpeck", "Cory Wong"],
        support: ["Joey Dosik"],
        date: "2024-12-29",
        venue: "O2 Academy Brixton",
        city: "London",
      },
      {
        artists: ["Jacob Collier"],
        date: "2024-01-01",
        venue: "O2 Academy Brixton",
        city: "London",
      },
      { artists: ["Couch"], date: "2024-06-01", venue: "Barbican", city: "London" },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    const chart = canvas.getByRole("img", { name: "Gigs by venue" });
    chart.focus();
    await userEvent.keyboard("{Home}{Enter}");
    await expect(canvas.getByRole("heading", { name: "O2 Academy Brixton, London" })).toBeVisible();
    await expect(canvas.getByText("Vulfpeck, Cory Wong")).toBeVisible();
    await expect(canvas.getByText("Support: Joey Dosik")).toBeVisible();
    await expect(canvas.getByText("1 Jan 2024")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Close details" })).toBeVisible();
  },
});
