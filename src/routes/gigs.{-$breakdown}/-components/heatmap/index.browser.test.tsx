import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";
import { assert } from "#/utils";

import { GigsHeatmap } from "./index";

import "#/routes/gigs.{-$breakdown}/index.css";

const [firstArchiveEvent, secondArchiveEvent] = gigs.events;

assert(firstArchiveEvent && secondArchiveEvent, "Expected archive events for the heatmap test.");

test("moves to a different month on every horizontal arrow press", async () => {
  const result = await page.renderWithProviders(
    <GigsHeatmap events={[{ ...firstArchiveEvent, date: "2024-01-01" }]} />,
  );

  const chart = result.getByRole("img", { name: copy.heatmapChart.title });
  await expect.element(chart).toBeVisible();
  chart.element().focus();
  await userEvent.keyboard("{Home}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], "2024"),
      }),
    )
    .toBeVisible();

  for (const month of copy.heatmapChart.months.slice(1, 4)) {
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(result.getByRole("heading", { name: copy.heatmapChart.monthTitle(month, "2024") }))
      .toBeVisible();
  }

  for (const month of copy.heatmapChart.months.slice(0, 3).toReversed()) {
    await userEvent.keyboard("{ArrowLeft}");
    await expect
      .element(result.getByRole("heading", { name: copy.heatmapChart.monthTitle(month, "2024") }))
      .toBeVisible();
  }

  await expect.element(chart).toHaveFocus();
});

test("visits each archive cell once without stopping on its label", async () => {
  const result = await page.renderWithProviders(<GigsHeatmap events={gigs.events} />);
  const chart = result.getByRole("img", { name: copy.heatmapChart.title });
  await expect.element(chart).toBeVisible();
  chart.element().focus();
  await userEvent.keyboard("{Home}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], "2015"),
      }),
    )
    .toBeVisible();

  for (const year of ["2016", "2017", "2018"]) {
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(
        result.getByRole("heading", {
          name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], year),
        }),
      )
      .toBeVisible();
  }

  await userEvent.keyboard("{ArrowUp}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], "2017"),
      }),
    )
    .toBeVisible();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[1], "2017"),
      }),
    )
    .toBeVisible();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[2], "2017"),
      }),
    )
    .toBeVisible();
  await userEvent.keyboard("{ArrowUp}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[2], "2016"),
      }),
    )
    .toBeVisible();
  await userEvent.keyboard("{ArrowLeft}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[1], "2016"),
      }),
    )
    .toBeVisible();
  await userEvent.keyboard("{Home}{ArrowLeft}{ArrowUp}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[0], "2015"),
      }),
    )
    .toBeVisible();
  await userEvent.keyboard("{End}{ArrowRight}{ArrowDown}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[11], "2026"),
      }),
    )
    .toBeVisible();
  await userEvent.keyboard("{ArrowLeft}{Enter}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[10], "2026"),
      }),
    )
    .toBeVisible();
  await expect
    .element(result.getByRole("button", { name: copy.heatmapChart.actions.close }))
    .toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.element(chart).toHaveFocus();
});

test("shows complete monthly event details and supports keyboard pinning and dismissal", async () => {
  const result = await page.renderWithProviders(
    <GigsHeatmap
      events={[
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
      ]}
    />,
  );

  const chart = result.getByRole("img", { name: copy.heatmapChart.title });
  await expect.element(chart).toBeVisible();
  chart.element().focus();
  await userEvent.keyboard("{Home}");
  await expect.element(result.getByText(copy.heatmapChart.empty.month)).toBeInTheDocument();
  await userEvent.keyboard("{End}{Enter}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.heatmapChart.monthTitle(copy.heatmapChart.months[11], "2024"),
      }),
    )
    .toBeVisible();
  await expect.element(result.getByText("Vulfpeck, Cory Wong")).toBeVisible();
  await expect
    .element(result.getByText(copy.heatmapChart.support(["Joey Dosik", "Phoebe Katis"])))
    .toBeVisible();
  await expect.element(result.getByText(/29 Dec 2024/)).toBeVisible();
  await expect
    .element(
      result.getByText(copy.formatVenue({ venue: "O2 Academy Brixton", city: "London" }), {
        exact: false,
      }),
    )
    .toBeVisible();
  await expect.element(result.getByText(/1 Dec 2024/)).toBeVisible();
  await expect.element(result.getByText(/Royal Albert Hall/)).toBeVisible();
  await result.getByRole("button", { name: copy.heatmapChart.actions.close }).click();
  await expect
    .element(result.getByRole("button", { name: copy.heatmapChart.actions.close }))
    .not.toBeInTheDocument();
  chart.element().focus();
  await userEvent.keyboard("{End}{Enter}{Escape}");
  await expect
    .element(result.getByRole("button", { name: copy.heatmapChart.actions.close }))
    .not.toBeInTheDocument();
});

test("renders exact monthly counts and a screen-reader-accessible table", async () => {
  const result = await page.renderWithProviders(
    <GigsHeatmap
      events={[
        { ...firstArchiveEvent, date: "2024-02-01" },
        { ...secondArchiveEvent, date: "2024-02-29" },
      ]}
    />,
  );

  await expect.element(result.getByRole("img", { name: copy.heatmapChart.title })).toBeVisible();
  const table = result.getByRole("table", { name: copy.heatmapChart.table.title });
  await expect.element(table).toBeInTheDocument();
  expect(table.getByRole("columnheader").all()).toHaveLength(13);
  const cells = table.getByRole("cell").all();
  expect(cells).toHaveLength(12);
  const [january, february] = cells;
  assert(january && february, "Expected monthly count cells.");
  await expect.element(january).toHaveTextContent("0");
  await expect.element(february).toHaveTextContent("2");
});

test("renders an explicit empty state without a chart", async () => {
  const result = await page.renderWithProviders(<GigsHeatmap events={[]} />);

  await expect.element(result.getByText(copy.heatmapChart.empty.title)).toBeVisible();
  await expect.element(result.getByRole("img")).not.toBeInTheDocument();
});
