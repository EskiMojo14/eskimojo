export interface ArtistEvent {
  artists: ReadonlyArray<string>;
  support?: ReadonlyArray<string>;
}

export function getArtistChartData<TEvent extends ArtistEvent>(events: ReadonlyArray<TEvent>) {
  const appearances = events.flatMap((event) => [
    ...Array.from(new Set(event.artists), (artist) => ({ artist, role: "Main" as const, event })),
    ...Array.from(new Set(event.support), (artist) => ({
      artist,
      role: "Support" as const,
      event,
    })),
  ]);
  return Array.from(
    Map.groupBy(appearances, ({ artist }) => artist),
    ([artist, entries]) => {
      const main = entries.filter(({ role }) => role === "Main").length;
      const support = entries.filter(({ role }) => role === "Support").length;
      return { artist, main, support, total: main + support, appearances: entries };
    },
  ).toSorted(
    (a, b) => b.main - a.main || b.support - a.support || a.artist.localeCompare(b.artist, "en"),
  );
}
