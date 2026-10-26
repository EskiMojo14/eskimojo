import * as v from "valibot";

import type { GigEvent } from "#/routes/gigs.{-$breakdown}/-data/gigs.gen";

export const gigMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface GigMonth<TEvent extends Pick<GigEvent, "date">> {
  year: string;
  month: string;
  count: number;
  events: ReadonlyArray<TEvent>;
}

const dateSchema = v.pipe(v.string(), v.isoDate());

export function getGigHeatmapData<TEvent extends Pick<GigEvent, "date">>(
  events: ReadonlyArray<TEvent>,
) {
  let firstYear = Infinity;
  let lastYear = -Infinity;

  const eventsByMonth = Map.groupBy(events, (event) => {
    const date = v.parse(dateSchema, event.date);
    const year = Number(date.slice(0, 4));
    firstYear = Math.min(firstYear, year);
    lastYear = Math.max(lastYear, year);
    return date.slice(0, 7);
  });

  for (const monthEvents of eventsByMonth.values()) {
    monthEvents.sort((left, right) => left.date.localeCompare(right.date));
  }

  const years =
    events.length === 0
      ? []
      : Array.from({ length: lastYear - firstYear + 1 }, (_, index) => String(firstYear + index));
  const cells: Array<GigMonth<TEvent>> = years.flatMap((year) =>
    gigMonths.map((month, index) => {
      const monthEvents = eventsByMonth.get(`${year}-${String(index + 1).padStart(2, "0")}`) ?? [];
      return { year, month, count: monthEvents.length, events: monthEvents };
    }),
  );

  return {
    years,
    cells,
    maxCount: Math.max(0, ...cells.map(({ count }) => count)),
    total: events.length,
  };
}
