import england from "./england-outline.json";

export const englandGeometry = { type: "MultiPolygon" as const, coordinates: england.coordinates };

export function getCityMapFit(cities: ReadonlyArray<{ coordinates: [number, number] }>) {
  if (!cities.length) return englandGeometry;
  const longitudes = cities.map(({ coordinates }) => coordinates[0]);
  const latitudes = cities.map(({ coordinates }) => coordinates[1]);
  const west = Math.min(...longitudes);
  const east = Math.max(...longitudes);
  const south = Math.min(...latitudes);
  const north = Math.max(...latitudes);
  // Keep a finite local frame even when all events are in one city.
  return {
    type: "MultiPoint" as const,
    coordinates: [
      [west - (west === east ? 0.15 : 0), south - (south === north ? 0.15 : 0)],
      [east + (west === east ? 0.15 : 0), north + (south === north ? 0.15 : 0)],
    ],
  };
}
const cityCoordinates = new Map<string, [number, number]>([
  ["London", [-0.1276, 51.5072]],
  ["Birmingham", [-1.8904, 52.4862]],
  ["Bradford-on-Avon", [-2.2506, 51.3475]],
  ["Bristol", [-2.5879, 51.4545]],
  ["Bath", [-2.359, 51.3811]],
  ["Brighton", [-0.1372, 50.8225]],
  ["Trowbridge", [-2.2081, 51.319]],
]);

export function getCityMapData<TEvent extends { city: string; date: string }>(
  events: ReadonlyArray<TEvent>,
) {
  return Array.from(
    Map.groupBy(events, ({ city }) => city),
    ([city, entries]) => {
      const coordinates = cityCoordinates.get(city);
      if (!coordinates) throw new Error(`Missing map coordinates for city: ${city}`);
      return {
        city,
        count: entries.length,
        coordinates,
        radius: 3 * Math.sqrt(entries.length),
        events: entries.toSorted((a, b) => a.date.localeCompare(b.date)),
      };
    },
  ).toSorted((a, b) => b.count - a.count || a.city.localeCompare(b.city, "en"));
}
