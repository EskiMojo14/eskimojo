import { expect, within } from "storybook/test";

import preview from "#.storybook/preview";
import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";
import { assert } from "#/utils";

import { GigsHeatmap } from "./index";

import "./index.css";

const [firstArchiveEvent, secondArchiveEvent] = gigs.events;

assert(firstArchiveEvent && secondArchiveEvent, "Expected archive events for the heatmap stories.");

const meta = preview.meta({
  title: "Gigs/Heatmap",
  component: GigsHeatmap,
  parameters: { layout: "padded" },
  args: { events: gigs.events },
});

export const Archive = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: copy.heatmapChart.title })).toBeVisible();
    const table = canvas.getByRole("table", { name: copy.heatmapChart.table.title });
    await expect(table).toBeInTheDocument();
    await expect(within(table).getAllByRole("columnheader")).toHaveLength(13);
    await expect(within(table).getAllByRole("rowheader")).toHaveLength(12);
  },
});

export const Empty = meta.story({
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: copy.heatmapChart.empty.title }),
    ).toBeVisible();
    await expect(canvas.getByText(copy.heatmapChart.empty.description)).toBeVisible();
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
});

export const KeyboardFocus = meta.story({
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const chart = canvas.getByRole("img", { name: copy.heatmapChart.title });
    await expect(chart).toHaveFocus();
    await userEvent.keyboard("{Home}{ArrowDown}");
    await expect(
      canvas.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], "2016"),
      }),
    ).toBeVisible();
    await userEvent.keyboard("{ArrowRight}");
    await expect(
      canvas.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[1], "2016"),
      }),
    ).toBeVisible();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(
      canvas.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], "2016"),
      }),
    ).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect(
      canvas.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], "2017"),
      }),
    ).toBeVisible();
    await userEvent.keyboard("{ArrowUp}");
    await expect(
      canvas.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], "2016"),
      }),
    ).toBeVisible();
    await userEvent.keyboard("{End}");
    await expect(
      canvas.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[11], "2026"),
      }),
    ).toBeVisible();
  },
});

export const SingleGig = meta.story({
  args: { events: [{ ...firstArchiveEvent, date: "2024-02-29" }] },
  play: async ({ canvas }) => {
    const row = canvas.getByRole("row", { name: /^2024 / });
    await expect(
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["0", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"]);
  },
});

export const MissingYear = meta.story({
  args: {
    events: [
      { ...firstArchiveEvent, date: "2022-12-31" },
      { ...secondArchiveEvent, date: "2024-01-01" },
    ],
  },
  play: async ({ canvas }) => {
    const row = canvas.getByRole("row", { name: /^2023 / });
    await expect(within(row).getAllByRole("cell")).toHaveLength(12);
    await expect(
      within(row)
        .getAllByRole("cell")
        .every((cell) => cell.textContent === "0"),
    ).toBe(true);
  },
});

export const MonthlyEvents = meta.story({
  args: {
    events: [
      {
        artists: ["Vulfpeck", "Cory Wong"],
        support: ["Joey Dosik", "Phoebe Katis"],
        date: "2024-12-29",
        venue: "O2 Academy Brixton",
        city: "London",
      },
      {
        artists: ["Jacob Collier"],
        date: "2024-12-01",
        venue: "Royal Albert Hall",
        city: "London",
      },
    ],
  },
  play: async ({ canvas, userEvent }) => {
    const chart = canvas.getByRole("img", { name: copy.heatmapChart.title });
    chart.focus();
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByText(copy.heatmapChart.empty.month)).toBeInTheDocument();
    await userEvent.keyboard("{End}{Enter}");
    await expect(
      canvas.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[11], "2024"),
      }),
    ).toBeVisible();
    await expect(canvas.getByText("Vulfpeck, Cory Wong")).toBeVisible();
    await expect(
      canvas.getByText(copy.heatmapChart.support(["Joey Dosik", "Phoebe Katis"])),
    ).toBeVisible();
    await expect(canvas.getByText(/29 Dec 2024/)).toBeVisible();
    await expect(
      canvas.getByText(copy.formatVenue({ venue: "O2 Academy Brixton", city: "London" }), {
        exact: false,
      }),
    ).toBeVisible();
    await expect(canvas.getByText("Jacob Collier")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: copy.heatmapChart.actions.close }));
    await expect(
      canvas.queryByRole("button", { name: copy.heatmapChart.actions.close }),
    ).not.toBeInTheDocument();
  },
});
