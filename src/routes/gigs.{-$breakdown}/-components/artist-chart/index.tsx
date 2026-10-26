import { barX, defineChart, stack } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/tooltip";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { portal } from "@tanstack/charts/tooltip/portal";
import { useMemo } from "react";

import { formatVenue } from "#/routes/gigs.{-$breakdown}/-components/venue-label";
import type { GigEvent } from "#/routes/gigs.{-$breakdown}/-data/gigs.gen";
import { Button } from "#/shared/components/buttons/button";
import { EmptyState } from "#/shared/components/empty-state";
import { MdSymbol } from "#/shared/components/symbol";
import { formatDate } from "#/shared/lib/date";

import { getArtistChartData, type ArtistEvent } from "./data";

interface ArtistTooltipAppearance {
  artist: string;
  role: "Main" | "Support";
  count: number;
}

function isArtistTooltipAppearance(value: unknown): value is ArtistTooltipAppearance {
  return (
    typeof value === "object" &&
    value !== null &&
    "artist" in value &&
    typeof value.artist === "string" &&
    "role" in value &&
    (value.role === "Main" || value.role === "Support") &&
    "count" in value &&
    typeof value.count === "number"
  );
}

export function GigsArtistChart({
  events,
}: {
  events: ReadonlyArray<ArtistEvent & Pick<GigEvent, "date" | "venue" | "city">>;
}) {
  const artists = useMemo(() => getArtistChartData(events), [events]);

  const definition = useMemo(
    () =>
      defineChart({
        focus: "group-y",
        focusRing: false,
        marks: [
          barX(
            artists.flatMap((artist) =>
              [
                { ...artist, role: "Main", count: artist.main },
                { ...artist, role: "Support", count: artist.support },
              ].filter(({ count }) => count > 0),
            ),
            {
              x: "count",
              y: "artist",
              z: "role",
              color: "role",
              key: (row) => `${row.artist}-${row.role}`,
              layout: stack({ order: ["Main", "Support"] }),
              inset: 4,
              states: [
                {
                  when: ({ datum, focus }) => datum === focus.primary.datum,
                  style: { stroke: "var(--md-sys-color-on-surface)", strokeWidth: 2 },
                },
              ],
            },
          ),
        ],
        scales: {
          y: { scale: () => scaleBand().domain(artists.map(({ artist }) => artist)) },
          x: {
            scale: scaleLinear().domain([0, Math.max(1, ...artists.map(({ total }) => total))]),
            side: "top",
          },
          xBottom: {
            channel: "x",
            scale: scaleLinear().domain([0, Math.max(1, ...artists.map(({ total }) => total))]),
            side: "bottom",
          },
        },
        color: {
          domain: ["Main", "Support"],
          range: ["var(--md-sys-color-primary)", "var(--md-sys-color-tertiary)"],
        },
        tooltip: {
          use: tooltip,
          portal,
          sticky: true,
          content: (points, context) => {
            const candidate = context.primaryPoint?.datum ?? points[0]?.datum;
            const appearance = isArtistTooltipAppearance(candidate) ? candidate : undefined;
            return {
              title: appearance?.artist ?? "",
              rows: appearance ? [{ label: appearance.role, value: String(appearance.count) }] : [],
            };
          },
        },
      }),
    [artists],
  );

  if (!artists.length) {
    return (
      <EmptyState
        icon={<MdSymbol>artist</MdSymbol>}
        title="No artists recorded yet."
        description="Artists will appear here when gigs are added to the archive."
      />
    );
  }

  return (
    <section className="gigs-artists" aria-label="Gigs by artist">
      <h2>Gigs by artist</h2>
      <ul className="gigs-artists__legend" aria-label="Appearance types">
        <li>
          <span className="gigs-artists__key gigs-artists__key--main" />
          Main
        </li>
        <li>
          <span className="gigs-artists__key gigs-artists__key--support" />
          Support
        </li>
      </ul>
      <Chart
        definition={definition}
        height={artists.length * 32 + 56}
        initialWidth={720}
        ariaLabel="Gigs by artist"
        ariaDescription="One horizontal bar per artist, stacked by Main and Support appearances. Artists are sorted by Main appearances, then Support appearances, highest first. A table of exact counts follows for screen readers."
        renderTooltipBody={({ content, primaryPoint, pinned, dismiss }) => {
          if (typeof content === "string") return content;

          const role = primaryPoint?.datum.role;
          const appearances = primaryPoint?.datum.appearances
            .filter((appearance) => appearance.role === role)
            .toSorted((a, b) => a.event.date.localeCompare(b.event.date));

          return (
            <div className="tooltip--rich tooltip--chart gigs-artists__tooltip">
              <h3 className="tooltip__subhead">{content.title}</h3>
              {content.rows.map((row) => (
                <p key={row.label}>
                  {row.label}: {row.value}
                </p>
              ))}
              <ul className="gigs-artists__events">
                {appearances?.map(({ event, role: appearanceRole }, index) => (
                  <li key={index}>
                    <strong>{formatDate(event.date)}</strong>
                    <p>{formatVenue(event)}</p>
                    {appearanceRole === "Support" && (
                      <p className="gigs-artists__supported">
                        Supported {event.artists.join(", ")}
                      </p>
                    )}
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
          );
        }}
      />
      <div className="gigs-artists__table">
        <table>
          <caption>Recorded appearances per artist</caption>
          <thead>
            <tr>
              <th scope="col">Artist</th>
              <th scope="col">Main</th>
              <th scope="col">Support</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {artists.map(({ artist, main, support, total }) => (
              <tr key={artist}>
                <th scope="row">{artist}</th>
                <td>{main}</td>
                <td>{support}</td>
                <td>{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
