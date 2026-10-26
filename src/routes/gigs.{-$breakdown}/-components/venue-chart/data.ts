import { formatVenue } from "#/routes/gigs.{-$breakdown}/-components/venue-label";

export function getVenueChartData<TEvent extends { venue: string; city: string; date: string }>(
  events: ReadonlyArray<TEvent>,
) {
  return Array.from(Map.groupBy(events, formatVenue), ([venue, entries]) => ({
    venue,
    count: entries.length,
    events: entries.toSorted((a, b) => a.date.localeCompare(b.date)),
  })).toSorted((a, b) => b.count - a.count || a.venue.localeCompare(b.venue, "en"));
}
