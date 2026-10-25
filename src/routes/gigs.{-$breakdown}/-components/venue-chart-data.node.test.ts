import { expect, test } from "vite-plus/test";

import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { getVenueChartData } from "./venue-chart-data";

test("groups events by venue, sorts counts and ties, and retains events in date order", () => {
  const events = [
    { venue: "B", city: "London", date: "2024-12-01", artists: ["A", "B"] },
    { venue: "A", city: "London", date: "2024-01-01", artists: ["C"] },
    { venue: "B", city: "London", date: "2024-02-01", artists: ["D"], support: ["E"] },
    { venue: "C", city: "London", date: "2024-03-01", artists: ["F"] },
  ];
  expect(getVenueChartData(events)).toEqual([
    { venue: "B, London", count: 2, events: [events[2], events[0]] },
    { venue: "A, London", count: 1, events: [events[1]] },
    { venue: "C, London", count: 1, events: [events[3]] },
  ]);
  expect(events[0].date).toBe("2024-12-01");
});

test("keeps identically named venues in different cities separate", () => {
  expect(
    getVenueChartData([
      { venue: "Academy", city: "London", date: "2024-01-01" },
      { venue: "Academy", city: "Bristol", date: "2024-01-02" },
    ]).map(({ venue, count }) => ({ venue, count })),
  ).toEqual([
    { venue: "Academy, Bristol", count: 1 },
    { venue: "Academy, London", count: 1 },
  ]);
});

test("handles empty archives and counts every archive event once", () => {
  expect(getVenueChartData([])).toEqual([]);
  expect(getVenueChartData(gigs.events).reduce((sum, row) => sum + row.count, 0)).toBe(
    gigs.events.length,
  );
});
