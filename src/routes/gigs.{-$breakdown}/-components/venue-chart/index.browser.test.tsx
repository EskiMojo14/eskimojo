import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

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
  const table = result.getByRole("table", { name: "Recorded gigs per venue" });
  await expect
    .element(table.getByRole("row", { name: "Brixton, London 2", exact: true }))
    .toBeInTheDocument();
  await expect
    .element(table.getByRole("row", { name: "Barbican, London 1", exact: true }))
    .toBeInTheDocument();
  const chart = result.getByRole("img", { name: "Gigs by venue" });
  chart.element().focus();
  await userEvent.keyboard("{Home}{Enter}");
  await expect
    .element(result.getByRole("heading", { name: "Brixton, London", exact: true }))
    .toBeVisible();
  await expect.element(result.getByText("Vulfpeck, Cory Wong")).toBeVisible();
  await expect.element(result.getByText("Support: Joey Dosik")).toBeVisible();
  const entries = result.getByRole("listitem").all();
  expect(entries).toHaveLength(2);
  expect(entries[0].element().textContent).toContain("Jacob Collier");
  expect(entries[0].element().textContent).toContain("1 Jan 2024");
  expect(entries[0].element().textContent).not.toContain("Support:");
  expect(entries[1].element().textContent).toContain("29 Dec 2024");
  await result.getByRole("button", { name: "Close details" }).click();
  await expect
    .element(result.getByRole("button", { name: "Close details" }))
    .not.toBeInTheDocument();
  chart.element().focus();
  await userEvent.keyboard("{End}{Enter}");
  await expect
    .element(result.getByRole("heading", { name: "Barbican, London", exact: true }))
    .toBeVisible();
  await expect.element(result.getByText("Couch", { exact: true })).toBeVisible();
  await expect.element(result.getByText("Jacob Collier", { exact: true })).not.toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await expect
    .element(result.getByRole("button", { name: "Close details" }))
    .not.toBeInTheDocument();
});

test("shows an explicit empty state without a chart", async () => {
  const result = await page.renderWithProviders(<GigsVenueChart events={[]} />);
  await expect.element(result.getByText("No venues recorded yet.")).toBeVisible();
  await expect.element(result.getByRole("img")).not.toBeInTheDocument();
});
