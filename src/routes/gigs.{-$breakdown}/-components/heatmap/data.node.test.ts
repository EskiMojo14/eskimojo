import { describe, expect, it } from "vite-plus/test";

import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { getGigHeatmapData } from "./data";

describe("getGigHeatmapData", () => {
  it("counts events in calendar months regardless of order or day", () => {
    const result = getGigHeatmapData([
      { date: "2025-12-31" },
      { date: "2024-01-01" },
      { date: "2024-01-31" },
      { date: "2024-02-29" },
    ]);

    expect(result.years).toEqual(["2024", "2025"]);
    expect(result.cells).toHaveLength(24);
    expect(result.cells.filter(({ count }) => count > 0)).toEqual([
      {
        year: "2024",
        month: "Jan",
        count: 2,
        events: [{ date: "2024-01-01" }, { date: "2024-01-31" }],
      },
      { year: "2024", month: "Feb", count: 1, events: [{ date: "2024-02-29" }] },
      { year: "2025", month: "Dec", count: 1, events: [{ date: "2025-12-31" }] },
    ]);
    expect(result.maxCount).toBe(2);
    expect(result.total).toBe(4);
  });

  it("fills missing months and whole intervening years with zeroes", () => {
    const result = getGigHeatmapData([{ date: "2022-12-31" }, { date: "2024-01-01" }]);

    expect(result.years).toEqual(["2022", "2023", "2024"]);
    expect(result.cells).toHaveLength(36);
    expect(result.cells.filter(({ year }) => year === "2023")).toHaveLength(12);
    expect(
      result.cells.filter(({ year }) => year === "2023").every(({ count }) => count === 0),
    ).toBe(true);
    expect(result.cells[0]).toEqual({ year: "2022", month: "Jan", count: 0, events: [] });
    expect(result.cells.at(-1)).toEqual({ year: "2024", month: "Dec", count: 0, events: [] });
  });

  it("keeps complete event details sorted by date without mutating the input", () => {
    const events = [
      { ...gigs.events[4], date: "2024-02-29" },
      { ...gigs.events[0], date: "2024-02-01" },
    ];
    const result = getGigHeatmapData(events);
    const february = result.cells.find(({ month }) => month === "Feb");

    expect(february?.events).toEqual([events[1], events[0]]);
    expect(february?.count).toBe(2);
    expect(events[0].date).toBe("2024-02-29");
    expect(february?.events[1].support).toEqual(gigs.events[4].support);
  });

  it("returns an empty domain for an empty archive", () => {
    expect(getGigHeatmapData([])).toEqual({
      years: [],
      cells: [],
      maxCount: 0,
      total: 0,
    });
  });

  it("rejects malformed dates instead of silently losing events", () => {
    expect(() => getGigHeatmapData([{ date: "2024-13-01" }])).toThrow(/Invalid date/);
    expect(() => getGigHeatmapData([{ date: "not-a-date" }])).toThrow(/Invalid date/);
  });

  it("preserves every event in the actual archive", () => {
    const result = getGigHeatmapData(gigs.events);

    expect(result.cells.reduce((sum, row) => sum + row.count, 0)).toBe(gigs.events.length);
    expect(result.total).toBe(gigs.events.length);
    expect(result.cells).toHaveLength(result.years.length * 12);
    expect(result.years[0]).toBe("2015");
    expect(result.years.at(-1)).toBe("2026");
  });
});
