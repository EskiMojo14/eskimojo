import { expect, within } from "storybook/test";

import preview from "#.storybook/preview";
import { Route } from "#/routes/gigs.{-$breakdown}/index";

import { FilterChips } from "./index";

const meta = preview.meta({
  title: "Gigs/Filter Chips",
  component: FilterChips,
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    tanstack: { router: { route: Route } },
  },
});

export const AllFilters = meta.story({
  args: { artist: "Jazz Emu", venue: "Komedia, Bath", city: "Bath" },
  play: async ({ canvas }) => {
    const group = within(canvas.getByRole("group", { name: "Active gig filters" }));
    await expect(group.getByRole("link", { name: "Jazz Emu" })).toBeVisible();
    await expect(group.getByRole("link", { name: "Komedia, Bath" })).toBeVisible();
    await expect(group.getByRole("link", { name: "Bath" })).toBeVisible();
  },
});

export const NoFilters = meta.story({
  play: async ({ canvas }) => {
    const group = within(canvas.getByRole("group", { name: "Active gig filters" }));
    await expect(group.queryByRole("link")).not.toBeInTheDocument();
  },
});
