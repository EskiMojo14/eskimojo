import { expect, within } from "storybook/test";

import preview from "#.storybook/preview";
import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { GigsHeatmap } from "./heatmap";

import "./heatmap.css";

const meta = preview.meta({
  title: "Gigs/Heatmap",
  component: GigsHeatmap,
  parameters: { layout: "padded" },
  args: { events: gigs.events },
});

export const Archive = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: "Gigs by month and year" })).toBeVisible();
    const table = canvas.getByRole("table", { name: "Recorded gigs per month and year" });
    await expect(table).toBeInTheDocument();
    await expect(within(table).getAllByRole("columnheader")).toHaveLength(13);
    await expect(within(table).getAllByRole("rowheader")).toHaveLength(12);
  },
});

export const Empty = meta.story({
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No gigs recorded yet.")).toBeVisible();
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
});

export const KeyboardFocus = meta.story({
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const chart = canvas.getByRole("img", { name: "Gigs by month and year" });
    await expect(chart).toHaveFocus();
    await userEvent.keyboard("{Home}{ArrowDown}");
    await expect(canvas.getByRole("heading", { name: "Jan 2016" })).toBeVisible();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("heading", { name: "Feb 2016" })).toBeVisible();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvas.getByRole("heading", { name: "Jan 2016" })).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("heading", { name: "Jan 2017" })).toBeVisible();
    await userEvent.keyboard("{ArrowUp}");
    await expect(canvas.getByRole("heading", { name: "Jan 2016" })).toBeVisible();
    await userEvent.keyboard("{End}");
    await expect(canvas.getByRole("heading", { name: "Dec 2026" })).toBeVisible();
  },
});

export const SingleGig = meta.story({
  args: { events: [{ ...gigs.events[0], date: "2024-02-29" }] },
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
      { ...gigs.events[0], date: "2022-12-31" },
      { ...gigs.events[1], date: "2024-01-01" },
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
    const chart = canvas.getByRole("img", { name: "Gigs by month and year" });
    chart.focus();
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByText("No gigs recorded this month.")).toBeInTheDocument();
    await userEvent.keyboard("{End}{Enter}");
    await expect(canvas.getByRole("heading", { name: "Dec 2024" })).toBeVisible();
    await expect(canvas.getByText("Vulfpeck, Cory Wong")).toBeVisible();
    await expect(canvas.getByText(/Support: Joey Dosik, Phoebe Katis/)).toBeVisible();
    await expect(canvas.getByText(/29 Dec 2024/)).toBeVisible();
    await expect(canvas.getByText(/O2 Academy Brixton, London/)).toBeVisible();
    await expect(canvas.getByText("Jacob Collier")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Close details" }));
    await expect(canvas.queryByRole("button", { name: "Close details" })).not.toBeInTheDocument();
  },
});
