import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";

import { GigsArtistChart } from "./index";

import "./index.css";

test("renders exact artist counts and shows the focused appearance role", async () => {
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

  const table = result.getByRole("table", { name: copy.artistChart.table.title });
  await expect
    .element(table.getByRole("row", { name: "A 2 1 3", exact: true }))
    .toBeInTheDocument();
  await expect
    .element(table.getByRole("row", { name: "B 1 1 2", exact: true }))
    .toBeInTheDocument();
  await expect
    .element(table.getByRole("row", { name: "C 0 1 1", exact: true }))
    .toBeInTheDocument();
  const chart = result.getByRole("img", { name: copy.artistChart.title });
  chart.element().focus();
  await userEvent.keyboard("{Home}");
  await expect.element(result.getByRole("heading", { name: "A", exact: true })).toBeVisible();
  await expect
    .element(
      result.getByText(copy.artistChart.count(copy.artistChart.types.main, "2"), { exact: true }),
    )
    .toBeVisible();
  await expect
    .element(
      result.getByText(copy.artistChart.count(copy.artistChart.types.support, "1"), {
        exact: true,
      }),
    )
    .not.toBeInTheDocument();
  await expect.element(result.getByText("2 Feb 2024", { exact: true })).toBeVisible();
  await expect.element(result.getByText("3 Mar 2024", { exact: true })).toBeVisible();
  await expect.element(result.getByText("1 Jan 2024", { exact: true })).not.toBeInTheDocument();
  await userEvent.keyboard("{Enter}");
  await result.getByRole("button", { name: copy.artistChart.actions.close }).click();
  chart.element().focus();
  await userEvent.keyboard("{End}");
  await expect.element(result.getByRole("heading", { name: "C", exact: true })).toBeVisible();
  await expect
    .element(result.getByText(copy.artistChart.supported(["A"]), { exact: true }))
    .toBeVisible();
});

test("renders an explicit empty state without a chart", async () => {
  const result = await page.renderWithProviders(<GigsArtistChart events={[]} />);
  await expect.element(result.getByText(copy.artistChart.empty.title)).toBeVisible();
  await expect
    .element(result.getByRole("img", { name: copy.artistChart.title }))
    .not.toBeInTheDocument();
});

test("shows only the hovered artist appearance role", async () => {
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

  const chart = result.getByRole("img", { name: copy.artistChart.title });
  const supportBar = chart.element().querySelectorAll("rect")[1];
  const mainBar = chart.element().querySelectorAll("rect")[0];

  if (!supportBar || !mainBar) throw new Error("Expected both artist bar segments.");

  await userEvent.hover(supportBar);
  await expect.element(result.getByRole("heading", { name: "A", exact: true })).toBeVisible();
  await expect
    .element(
      result.getByText(copy.artistChart.count(copy.artistChart.types.support, "1"), {
        exact: true,
      }),
    )
    .toBeVisible();
  await expect.element(result.getByText("1 Jan 2024", { exact: true })).toBeVisible();
  await expect.element(result.getByText("3 Mar 2024", { exact: true })).not.toBeInTheDocument();
  await expect
    .element(
      result.getByText(copy.artistChart.count(copy.artistChart.types.main, "2"), { exact: true }),
    )
    .not.toBeInTheDocument();

  await userEvent.hover(mainBar);
  await expect
    .element(
      result.getByText(copy.artistChart.count(copy.artistChart.types.main, "2"), { exact: true }),
    )
    .toBeVisible();
  await expect.element(result.getByText("3 Mar 2024", { exact: true })).toBeVisible();
  await expect.element(result.getByText("1 Jan 2024", { exact: true })).not.toBeInTheDocument();
  await expect
    .element(
      result.getByText(copy.artistChart.count(copy.artistChart.types.support, "1"), {
        exact: true,
      }),
    )
    .not.toBeInTheDocument();
});
