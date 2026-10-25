import { expect, test } from "vite-plus/test";

import { getArtistChartData } from "./artist-chart-data";

test("counts main, co-billed and support-only artists separately", () => {
  expect(
    getArtistChartData([
      { artists: ["A", "B"], support: ["C"] },
      { artists: ["B"], support: ["A", "D"] },
      { artists: ["B", "B"], support: ["C", "C"] },
    ]),
  ).toMatchObject([
    { artist: "B", main: 3, support: 0, total: 3 },
    { artist: "A", main: 1, support: 1, total: 2 },
    { artist: "C", main: 0, support: 2, total: 2 },
    { artist: "D", main: 0, support: 1, total: 1 },
  ]);
});

test("handles empty archives and events without support", () => {
  expect(getArtistChartData([])).toEqual([]);
  expect(getArtistChartData([{ artists: ["A"], support: [] }])).toMatchObject([
    { artist: "A", main: 1, support: 0, total: 1 },
  ]);
});

test("sorts by Main before Support counts and retains source events and roles", () => {
  const events = [
    { artists: ["B", "A"], support: ["C", "D"] },
    { artists: ["B"], support: ["A", "C", "D"] },
    { artists: ["D"], support: ["C"] },
  ];
  const result = getArtistChartData(events);
  expect(result.map(({ artist }) => artist)).toEqual(["B", "D", "A", "C"]);
  expect(result.find(({ artist }) => artist === "A")?.appearances).toEqual([
    { artist: "A", role: "Main", event: events[0] },
    { artist: "A", role: "Support", event: events[1] },
  ]);
});
