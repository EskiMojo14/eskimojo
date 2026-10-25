import { expect, test } from "vite-plus/test";

import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { getVenueChartData } from "./venue-chart-data";

test("groups events by venue, sorts counts and ties, and retains events in date order", () => {
  const events = [
    { venue: "B", date: "2024-12-01", artists: ["A", "B"] },
    { venue: "A", date: "2024-01-01", artists: ["C"] },
    { venue: "B", date: "2024-02-01", artists: ["D"], support: ["E"] },
    { venue: "C", date: "2024-03-01", artists: ["F"] },
  ];
  expect(getVenueChartData(events)).toEqual([
    { venue: "B", count: 2, events: [events[2], events[0]] },
    { venue: "A", count: 1, events: [events[1]] },
    { venue: "C", count: 1, events: [events[3]] },
  ]);
  expect(events[0].date).toBe("2024-12-01");
});

test("handles empty archives and counts every archive event once", () => {
  expect(getVenueChartData([])).toEqual([]);
  expect(getVenueChartData(gigs.events).reduce((sum, row) => sum + row.count, 0)).toBe(
    gigs.events.length,
  );
});
