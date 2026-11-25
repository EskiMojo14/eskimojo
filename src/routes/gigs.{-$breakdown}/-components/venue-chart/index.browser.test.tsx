import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import { assert } from "#/utils";

import { GigsVenueChart } from "./index";

import "./index.css";

test("shows venue counts and chronological event details with keyboard pinning and dismissal", async () => {
  const result = await page.renderWithProviders(
    <GigsVenueChart
      events={[
        {
          artists: ["Vulfpeck", "Cory Wong"],
          support: ["Joey Dosik"],
          date: "2024-12-29",
          venue: "Brixton",
          city: "London",
        },
        { artists: ["Jacob Collier"], date: "2024-01-01", venue: "Brixton", city: "London" },
        { artists: ["Couch"], date: "2024-06-01", venue: "Barbican", city: "London" },
      ]}
    />,
  );

  const table = result.getByRole("table", { name: copy.venueChart.table.title });
  await expect
    .element(
      table.getByRole("row", {
        name: `${copy.formatVenue({ venue: "Brixton", city: "London" })} 2`,
        exact: true,
      }),
    )
    .toBeInTheDocument();
  await expect
    .element(
      table.getByRole("row", {
        name: `${copy.formatVenue({ venue: "Barbican", city: "London" })} 1`,
        exact: true,
      }),
    )
    .toBeInTheDocument();
  const chart = result.getByRole("img", { name: copy.venueChart.title });
  chart.element().focus();
  await userEvent.keyboard("{Home}{Enter}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.formatVenue({ venue: "Brixton", city: "London" }),
        exact: true,
      }),
    )
    .toBeVisible();
  await expect.element(result.getByText(copy.venueChart.count(2), { exact: true })).toBeVisible();
  await expect.element(result.getByText("Vulfpeck, Cory Wong")).toBeVisible();
  await expect.element(result.getByText(copy.venueChart.support(["Joey Dosik"]))).toBeVisible();
  const entries = result.getByRole("listitem").all();
  expect(entries).toHaveLength(2);
  const [earlier, later] = entries;
  assert(earlier && later, "Expected both gigs at the selected venue.");
  expect(earlier.element().textContent).toContain("Jacob Collier");
  expect(earlier.element().textContent).toContain("1 Jan 2024");
  expect(earlier.element().textContent).not.toContain(copy.venueChart.support(["Joey Dosik"]));
  expect(later.element().textContent).toContain("29 Dec 2024");
  await result.getByRole("button", { name: copy.venueChart.actions.close }).click();
  await expect
    .element(result.getByRole("button", { name: copy.venueChart.actions.close }))
    .not.toBeInTheDocument();
  chart.element().focus();
  await userEvent.keyboard("{End}{Enter}");
  await expect
    .element(
      result.getByRole("heading", {
        name: copy.formatVenue({ venue: "Barbican", city: "London" }),
        exact: true,
      }),
    )
    .toBeVisible();
  await expect.element(result.getByText(copy.venueChart.count(1), { exact: true })).toBeVisible();
  await expect.element(result.getByText("Couch", { exact: true })).toBeVisible();
  await expect.element(result.getByText("Jacob Collier", { exact: true })).not.toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await expect
    .element(result.getByRole("button", { name: copy.venueChart.actions.close }))
    .not.toBeInTheDocument();
});

test("shows an explicit empty state without a chart", async () => {
  const result = await page.renderWithProviders(<GigsVenueChart events={[]} />);
  await expect.element(result.getByText(copy.venueChart.empty.title)).toBeVisible();
  await expect.element(result.getByRole("img")).not.toBeInTheDocument();
});
