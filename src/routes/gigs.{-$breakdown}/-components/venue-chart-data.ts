export function getVenueChartData<TEvent extends { venue: string; date: string }>(
  events: ReadonlyArray<TEvent>,
) {
  return Array.from(
    Map.groupBy(events, ({ venue }) => venue),
    ([venue, entries]) => ({
      venue,
      count: entries.length,
      events: entries.toSorted((a, b) => a.date.localeCompare(b.date)),
    }),
  ).toSorted((a, b) => b.count - a.count || a.venue.localeCompare(b.venue, "en"));
}
