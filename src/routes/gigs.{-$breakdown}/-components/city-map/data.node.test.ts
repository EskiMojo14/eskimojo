import { geoMercator, geoPath } from "d3-geo";
import { expect, test } from "vite-plus/test";

import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";

import { englandGeometry, getCityMapFit, getCityMapData } from "./data";

test("groups cities, sorts counts and events, and scales dot area with event count", () => {
  const events = [
    { city: "London", date: "2024-12-01" },
    { city: "Bristol", date: "2024-02-01" },
    { city: "London", date: "2024-01-01" },
    { city: "Bath", date: "2024-03-01" },
  ];
  const cities = getCityMapData(events);
  expect(cities.map(({ city, count }) => ({ city, count }))).toEqual([
    { city: "London", count: 2 },
    { city: "Bath", count: 1 },
    { city: "Bristol", count: 1 },
  ]);
  expect(cities[0].events).toEqual([events[2], events[0]]);
  expect(cities[0].radius ** 2 / cities[1].radius ** 2).toBeCloseTo(2);
  expect(events[0].date).toBe("2024-12-01");
});

test("locates every archive city in England and counts every event once", () => {
  const cities = getCityMapData(gigs.events);
  expect(cities.reduce((total, { count }) => total + count, 0)).toBe(gigs.events.length);
  expect(cities).toHaveLength(7);
  for (const {
    coordinates: [longitude, latitude],
  } of cities) {
    expect(longitude).toBeGreaterThan(-6);
    expect(longitude).toBeLessThan(2);
    expect(latitude).toBeGreaterThan(50);
    expect(latitude).toBeLessThan(56);
  }
  const bristol = cities.find(({ city }) => city === "Bristol")!;
  const london = cities.find(({ city }) => city === "London")!;
  expect(bristol.coordinates[0]).toBeLessThan(london.coordinates[0]);
  expect(geoPath(geoMercator())(englandGeometry)).toMatch(/^M/);
});

test("handles an empty archive and explicitly rejects cities without coordinates", () => {
  expect(getCityMapData([])).toEqual([]);
  expect(() => getCityMapData([{ city: "Unknown", date: "2024-01-01" }])).toThrow(
    "Missing map coordinates for city: Unknown",
  );
});

test("fits the event region rather than the full England outline", () => {
  const cities = getCityMapData(gigs.events);
  const fit = getCityMapFit(cities);
  expect(fit).toEqual({
    type: "MultiPoint",
    coordinates: [
      [-2.5879, 50.8225],
      [-0.1276, 52.4862],
    ],
  });
  expect(getCityMapFit([])).toBe(englandGeometry);
});

test("keeps a single-city projection finite", () => {
  const cities = getCityMapData([{ city: "Bristol", date: "2024-01-01" }]);
  const projection = geoMercator().fitSize([720, 520], getCityMapFit(cities));
  const position = projection(cities[0].coordinates)!;
  expect(position[0]).toBeCloseTo(360);
  expect(position[1]).toBeCloseTo(260, 0);
  expect(Number.isFinite(projection.scale())).toBe(true);
});
