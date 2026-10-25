import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, onTestFinished, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";
import { Route as GigsRoute } from "#/routes/gigs.{-$breakdown}/index";

import { GigsHeatmap } from "./heatmap";

import "./heatmap.css";

test("moves to a different month on every horizontal arrow press", async () => {
  const result = await page.renderWithProviders(
    <GigsHeatmap events={[{ ...gigs.events[0], date: "2024-01-01" }]} />,
  );
  const chart = result.getByRole("img", { name: "Gigs by month and year" });
  await expect.element(chart).toBeVisible();
  chart.element().focus();
  await userEvent.keyboard("{Home}");
  await expect.element(result.getByRole("heading", { name: "Jan 2024" })).toBeVisible();
  for (const month of ["Feb", "Mar", "Apr"]) {
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(result.getByRole("heading", { name: `${month} 2024` })).toBeVisible();
  }
  for (const month of ["Mar", "Feb", "Jan"]) {
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(result.getByRole("heading", { name: `${month} 2024` })).toBeVisible();
  }
  await expect.element(chart).toHaveFocus();
});

test("visits each archive cell once without stopping on its label", async () => {
  const result = await page.renderWithProviders(<GigsHeatmap events={gigs.events} />);
  const chart = result.getByRole("img", { name: "Gigs by month and year" });
  await expect.element(chart).toBeVisible();
  chart.element().focus();
  await userEvent.keyboard("{Home}");
  await expect.element(result.getByRole("heading", { name: "Jan 2015" })).toBeVisible();
  for (const year of ["2016", "2017", "2018"]) {
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(result.getByRole("heading", { name: `Jan ${year}` })).toBeVisible();
  }
  await userEvent.keyboard("{ArrowUp}");
  await expect.element(result.getByRole("heading", { name: "Jan 2017" })).toBeVisible();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(result.getByRole("heading", { name: "Feb 2017" })).toBeVisible();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(result.getByRole("heading", { name: "Mar 2017" })).toBeVisible();
  await userEvent.keyboard("{ArrowUp}");
  await expect.element(result.getByRole("heading", { name: "Mar 2016" })).toBeVisible();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(result.getByRole("heading", { name: "Feb 2016" })).toBeVisible();
  await userEvent.keyboard("{Home}{ArrowLeft}{ArrowUp}");
  await expect.element(result.getByRole("heading", { name: "Jan 2015" })).toBeVisible();
  await userEvent.keyboard("{End}{ArrowRight}{ArrowDown}");
  await expect.element(result.getByRole("heading", { name: "Dec 2026" })).toBeVisible();
  await userEvent.keyboard("{ArrowLeft}{Enter}");
  await expect.element(result.getByRole("heading", { name: "Nov 2026" })).toBeVisible();
  await expect.element(result.getByRole("button", { name: "Close details" })).toBeVisible();
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
  const chart = result.getByRole("img", { name: "Gigs by month and year" });
  await expect.element(chart).toBeVisible();
  chart.element().focus();
  await userEvent.keyboard("{Home}");
  await expect.element(result.getByText("No gigs recorded this month.")).toBeInTheDocument();
  await userEvent.keyboard("{End}{Enter}");
  await expect.element(result.getByRole("heading", { name: "Dec 2024" })).toBeVisible();
  await expect.element(result.getByText("Vulfpeck, Cory Wong")).toBeVisible();
  await expect.element(result.getByText(/Support: Joey Dosik, Phoebe Katis/)).toBeVisible();
  await expect.element(result.getByText(/29 Dec 2024/)).toBeVisible();
  await expect.element(result.getByText(/O2 Academy Brixton, London/)).toBeVisible();
  await expect.element(result.getByText(/1 Dec 2024/)).toBeVisible();
  await expect.element(result.getByText(/Royal Albert Hall/)).toBeVisible();
  await result.getByRole("button", { name: "Close details" }).click();
  await expect
    .element(result.getByRole("button", { name: "Close details" }))
    .not.toBeInTheDocument();
  chart.element().focus();
  await userEvent.keyboard("{End}{Enter}{Escape}");
  await expect
    .element(result.getByRole("button", { name: "Close details" }))
    .not.toBeInTheDocument();
});

test.each([320, 390, 768])("fits the chart within a %ipx viewport", async (width) => {
  const originalViewport = { width: window.innerWidth, height: window.innerHeight };
  onTestFinished(() => page.viewport(originalViewport.width, originalViewport.height));
  await page.viewport(width, 844);
  const result = await page.renderWithProviders(<GigsHeatmap events={gigs.events} />);
  const chart = result.getByRole("img", { name: "Gigs by month and year" });
  await expect.element(chart).toBeVisible();
  await expect.poll(() => chart.element().getBoundingClientRect().width).toBeLessThanOrEqual(width);
  await expect.poll(() => document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  await expect
    .poll(() => chart.element().querySelectorAll("rect").length)
    .toBeGreaterThanOrEqual(144);
});

test("renders exact monthly counts and a screen-reader-accessible table", async () => {
  const result = await page.renderWithProviders(
    <GigsHeatmap
      events={[
        { ...gigs.events[0], date: "2024-02-01" },
        { ...gigs.events[1], date: "2024-02-29" },
      ]}
    />,
  );

  await expect.element(result.getByRole("img", { name: "Gigs by month and year" })).toBeVisible();
  await expect.element(result.getByText(/2 gigs total/)).toBeVisible();
  const table = result.getByRole("table", { name: "Recorded gigs per month and year" });
  await expect.element(table).toBeInTheDocument();
  expect(table.getByRole("columnheader").all()).toHaveLength(13);
  const cells = table.getByRole("cell").all();
  expect(cells).toHaveLength(12);
  await expect.element(cells[0]).toHaveTextContent("0");
  await expect.element(cells[1]).toHaveTextContent("2");
});

test("renders an explicit empty state without a chart", async () => {
  const result = await page.renderWithProviders(<GigsHeatmap events={[]} />);

  await expect.element(result.getByText("No gigs recorded yet.")).toBeVisible();
  await expect.element(result.getByRole("img")).not.toBeInTheDocument();
});

test.each(["/gigs", "/gigs/by-month"])(
  "shows the heatmap at %s and only in the month view",
  async (initialEntry) => {
    const root = createRootRoute();
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: [initialEntry] }),
      routeTree: root.addChildren([
        createRoute({
          getParentRoute: () => root,
          path: "/gigs/{-$breakdown}/",
          component: GigsRoute.options.component,
        }),
      ]),
    });
    const result = await page.renderWithProviders(<RouterProvider router={router} />);
    const chart = result.getByRole("img", { name: "Gigs by month and year" });

    await expect.element(chart).toBeVisible();
    await result.getByRole("link", { name: "Artist", exact: true }).click();
    await expect.element(chart).not.toBeInTheDocument();
    await expect.element(result.getByRole("img", { name: "Gigs by artist" })).toBeVisible();
    await result.getByRole("link", { name: "Month", exact: true }).click();
    await expect.element(chart).toBeVisible();
    await result.getByRole("link", { name: "City", exact: true }).click();
    await expect.element(chart).not.toBeInTheDocument();
    await result.getByRole("link", { name: "Venue", exact: true }).click();
    await expect.element(result.getByRole("img", { name: "Gigs by venue" })).toBeVisible();
  },
);
