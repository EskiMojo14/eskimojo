import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { GigsCityMap } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Gigs/Cities",
  component: GigsCityMap,
  parameters: { layout: "padded" },
  args: { events: gigs.events },
});

export const Archive = meta.story({});

export const Empty = meta.story({
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: copy.cityChart.empty.title })).toBeVisible();
    await expect(canvas.getByText(copy.cityChart.empty.description)).toBeVisible();
  },
});

export const NearbyCities = meta.story({
  args: {
    events: [
      { artists: ["Bath act"], venue: "Forum", city: "Bath", date: "2024-01-01" },
      {
        artists: ["Bradford act"],
        venue: "Wiltshire Music Centre",
        city: "Bradford-on-Avon",
        date: "2024-02-01",
      },
      { artists: ["Trowbridge act"], venue: "Town Hall", city: "Trowbridge", date: "2024-03-01" },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    const chart = canvas.getByRole("img", { name: copy.cityChart.label });
    chart.focus();
    await userEvent.keyboard("{End}{Enter}");
    await expect(canvas.getByRole("heading", { name: "Trowbridge" })).toBeVisible();
    await expect(
      canvas.getByText(copy.formatVenue({ venue: "Town Hall", city: "Trowbridge" })),
    ).toBeVisible();
  },
});
