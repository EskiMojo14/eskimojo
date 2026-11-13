import { expect, test } from "vite-plus/test";

import gigs from "#/routes/gigs.{-$breakdown}/-data/gigs.json";
import { assert } from "#/utils";

import { englandGeometry, getCityMapFit, getCityMapData } from "./data";

test("groups cities, sorts counts and events, and scales dot area with event count", () => {
  const events = [
    { city: "London", date: "2024-12-01" },
    { city: "Bristol", date: "2024-02-01" },
    { city: "London", date: "2024-01-01" },
    { city: "Bath", date: "2024-03-01" },
  ];
  const cities = getCityMapData(events);
  const [firstEvent, secondEvent, thirdEvent] = events;
  assert(firstEvent && secondEvent && thirdEvent, "Expected four city-map event fixtures.");
  expect(cities.map(({ city, count }) => ({ city, count }))).toEqual([
    { city: "London", count: 2 },
    { city: "Bath", count: 1 },
    { city: "Bristol", count: 1 },
  ]);
  const [london, bath] = cities;
  assert(london && bath, "Expected London and Bath city data.");
  expect(london.events).toEqual([thirdEvent, firstEvent]);
  expect(london.radius ** 2 / bath.radius ** 2).toBeCloseTo(2);
  expect(firstEvent.date).toBe("2024-12-01");
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
  const singleCityFit = getCityMapFit([{ coordinates: [-2.5879, 51.4545] }]);
  expect(singleCityFit.type).toBe("MultiPoint");
  const [southWest, northEast] = singleCityFit.coordinates;
  assert(southWest && northEast, "Expected two corners for the city-map fit.");
  expect(southWest[0]).toBeCloseTo(-2.7379);
  expect(southWest[1]).toBeCloseTo(51.3045);
  expect(northEast[0]).toBeCloseTo(-2.4379);
  expect(northEast[1]).toBeCloseTo(51.6045);
});
