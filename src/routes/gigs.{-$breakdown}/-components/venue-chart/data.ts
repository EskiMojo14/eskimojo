import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";

export function getVenueChartData<TEvent extends { venue: string; city: string; date: string }>(
  events: ReadonlyArray<TEvent>,
) {
  return Array.from(Map.groupBy(events, copy.formatVenue), ([venue, entries]) => ({
    venue,
    count: entries.length,
    events: entries.toSorted((a, b) => a.date.localeCompare(b.date)),
  })).toSorted((a, b) => b.count - a.count || a.venue.localeCompare(b.venue, "en"));
}
