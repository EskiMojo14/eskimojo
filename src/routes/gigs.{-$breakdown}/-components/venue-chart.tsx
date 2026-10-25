import { barX, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/tooltip";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { portal } from "@tanstack/charts/tooltip/portal";
import { useMemo } from "react";

import { Button } from "#/shared/components/buttons/button";
import { formatDate } from "#/shared/lib/date";

import type { ArtistEvent } from "./artist-chart-data";
import { getVenueChartData } from "./venue-chart-data";

export function GigsVenueChart({
  events,
}: {
  events: ReadonlyArray<ArtistEvent & { venue: string; date: string }>;
}) {
  const venues = useMemo(() => getVenueChartData(events), [events]);
  const definition = useMemo(
    () =>
      defineChart({
        focus: "group-y",
        focusRing: false,
        marks: [
          barX(venues, {
            x: "count",
            y: "venue",
            key: "venue",
            fill: "var(--md-sys-color-primary)",
            inset: 4,
            states: [
              {
                when: ({ datum, focus }) => datum === focus.primary.datum,
                style: { stroke: "var(--md-sys-color-on-surface)", strokeWidth: 2 },
              },
            ],
          }),
        ],
        scales: {
          y: { scale: () => scaleBand().domain(venues.map(({ venue }) => venue)) },
          x: {
            scale: scaleLinear().domain([0, Math.max(1, ...venues.map(({ count }) => count))]),
            side: "top",
          },
          xBottom: {
            channel: "x",
            scale: scaleLinear().domain([0, Math.max(1, ...venues.map(({ count }) => count))]),
            side: "bottom",
          },
        },
        tooltip: {
          use: tooltip,
          portal,
          sticky: true,
          content: (points) => {
            const venue = points[0]?.datum;
            return {
              title: venue?.venue ?? "",
              rows: venue ? [{ label: "Gigs", value: String(venue.count) }] : [],
            };
          },
        },
      }),
    [venues],
  );

  if (!venues.length) return <p className="gigs-venues">No venues recorded yet.</p>;

  return (
    <section className="gigs-venues" aria-label="Gigs by venue">
      <h2>Gigs by venue</h2>
      <Chart
        definition={definition}
        height={venues.length * 32 + 56}
        initialWidth={720}
        ariaLabel="Gigs by venue"
        ariaDescription="One horizontal bar per venue, sorted by gig count, highest first. A table of exact counts follows for screen readers."
        renderTooltipBody={({ content, primaryPoint, pinned, dismiss }) =>
          typeof content === "string" ? (
            content
          ) : (
            <div className="tooltip--rich gigs-venues__tooltip">
              <h3 className="tooltip__subhead">{content.title}</h3>
              <p>
                {primaryPoint?.datum.count} {primaryPoint?.datum.count === 1 ? "gig" : "gigs"}
              </p>
              <ul className="gigs-venues__events">
                {primaryPoint?.datum.events.map((event, index) => (
                  <li key={index}>
                    <strong>{event.artists.join(", ")}</strong>
                    <p>{formatDate(event.date)}</p>
                    {event.support?.length ? (
                      <p className="gigs-venues__support">Support: {event.support.join(", ")}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              {pinned && (
                <div className="tooltip__actions">
                  <Button variant="text" onClick={dismiss}>
                    Close details
                  </Button>
                </div>
              )}
            </div>
          )
        }
      />
      <div className="gigs-venues__table">
        <table>
          <caption>Recorded gigs per venue</caption>
          <thead>
            <tr>
              <th scope="col">Venue</th>
              <th scope="col">Gigs</th>
            </tr>
          </thead>
          <tbody>
            {venues.map(({ venue, count }) => (
              <tr key={venue}>
                <th scope="row">{venue}</th>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
