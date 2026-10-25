import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { GigsArtistChart } from "./artist-chart";

import "./artist-chart.css";

test("renders exact artist counts and shows both roles on keyboard focus", async () => {
  const result = await page.renderWithProviders(
    <GigsArtistChart
      events={[
        { artists: ["A"], support: ["B"], date: "2024-03-03", venue: "Brixton", city: "London" },
        {
          artists: ["B"],
          support: ["A"],
          date: "2024-01-01",
          venue: "Royal Albert Hall",
          city: "London",
        },
        { artists: ["A"], support: ["C"], date: "2024-02-02", venue: "Barbican", city: "London" },
      ]}
    />,
  );
  const table = result.getByRole("table", { name: "Recorded appearances per artist" });
  await expect
    .element(table.getByRole("row", { name: "A 2 1 3", exact: true }))
    .toBeInTheDocument();
  await expect
    .element(table.getByRole("row", { name: "B 1 1 2", exact: true }))
    .toBeInTheDocument();
  await expect
    .element(table.getByRole("row", { name: "C 0 1 1", exact: true }))
    .toBeInTheDocument();
  const chart = result.getByRole("img", { name: "Gigs by artist" });
  chart.element().focus();
  await userEvent.keyboard("{Home}");
  await expect.element(result.getByRole("heading", { name: "A", exact: true })).toBeVisible();
  await expect.element(result.getByText("Main: 2")).toBeVisible();
  await expect.element(result.getByText("Support: 1")).toBeVisible();
  await expect.element(result.getByText("Supported B", { exact: true })).toBeVisible();
  await expect
    .element(result.getByText("Royal Albert Hall, London", { exact: true }))
    .toBeVisible();
  await expect.element(result.getByText("1 Jan 2024", { exact: true })).toBeVisible();
  const entries = result.getByRole("listitem").all();
  expect(entries[2].element().textContent).toContain("1 Jan 2024");
  expect(entries[3].element().textContent).toContain("2 Feb 2024");
  expect(entries[3].element().textContent).not.toContain("Supported");
  expect(entries[4].element().textContent).toContain("3 Mar 2024");
  await userEvent.keyboard("{Enter}");
  await result.getByRole("button", { name: "Close details" }).click();
  chart.element().focus();
  await userEvent.keyboard("{End}");
  await expect.element(result.getByRole("heading", { name: "C", exact: true })).toBeVisible();
  await expect.element(result.getByText("Supported A", { exact: true })).toBeVisible();
});

test("renders an explicit empty state without a chart", async () => {
  const result = await page.renderWithProviders(<GigsArtistChart events={[]} />);
  await expect.element(result.getByText("No artists recorded yet.")).toBeVisible();
  await expect.element(result.getByRole("img")).not.toBeInTheDocument();
});
