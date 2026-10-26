import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { GigsCityMap } from "./city-map";

import "./city-map.css";

test("shows city counts in a table and chronological events in marker tooltips", async () => {
  const result = await page.renderWithProviders(
    <GigsCityMap
      events={[
        {
          artists: ["Later"],
          support: ["Support act"],
          venue: "Thekla",
          city: "Bristol",
          date: "2024-12-01",
        },
        { artists: ["Earlier"], venue: "Beacon", city: "Bristol", date: "2024-01-01" },
        { artists: ["Bath act"], venue: "Forum", city: "Bath", date: "2024-02-01" },
      ]}
    />,
  );
  const table = result.getByRole("table", { name: "Recorded gigs per city" });
  await expect.element(table.getByRole("row", { name: "Bristol 2" })).toBeInTheDocument();
  const chart = result.getByRole("img", { name: "Map of England" });
  chart.element().focus();
  await userEvent.keyboard("{Home}{Enter}");
  await expect.element(result.getByRole("heading", { name: "Bristol", exact: true })).toBeVisible();
  const entries = result.getByRole("listitem").all();
  expect(entries[0].element().textContent).toContain("Earlier");
  expect(entries[1].element().textContent).toContain("Support: Support act");
  await expect.element(result.getByText("Thekla, Bristol")).toBeVisible();
  await result.getByRole("button", { name: "Close details" }).click();
  await expect
    .element(result.getByRole("button", { name: "Close details" }))
    .not.toBeInTheDocument();
  chart.element().focus();
  await userEvent.keyboard("{End}{Enter}");
  await expect.element(result.getByRole("heading", { name: "Bath", exact: true })).toBeVisible();
  await expect.element(result.getByText("Forum, Bath")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect
    .element(result.getByRole("button", { name: "Close details" }))
    .not.toBeInTheDocument();
});

test("shows an empty state without a map", async () => {
  const result = await page.renderWithProviders(<GigsCityMap events={[]} />);
  await expect.element(result.getByText("No cities recorded yet.")).toBeVisible();
  await expect.element(result.getByRole("img")).not.toBeInTheDocument();
});
