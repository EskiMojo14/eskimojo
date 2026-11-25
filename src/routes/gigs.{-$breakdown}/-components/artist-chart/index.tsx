import { barX, defineChart, stack } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react/tooltip";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { portal } from "@tanstack/charts/tooltip/portal";
import { useMemo } from "react";

import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import type { GigEvent } from "#/routes/gigs.{-$breakdown}/-data/gigs.gen";
import { Button } from "#/shared/components/buttons/button";
import { InternalLinkButton } from "#/shared/components/buttons/link-button/index.tsx";
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
                { ...artist, role: "Main" as const, count: artist.main },
                { ...artist, role: "Support" as const, count: artist.support },
              ].filter(({ count }) => count > 0),
            ),
            {
              x: "count",
              y: "artist",
              z: "role",
              color: "role",
              stroke: "var(--md-sys-color-on-surface)",
              strokeWidth: 1,
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
          range: ["var(--gigs-bar-main)", "var(--gigs-bar-support)"],
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
              rows: appearance
                ? [
                    {
                      label:
                        appearance.role === "Main"
                          ? copy.artistChart.types.main
                          : copy.artistChart.types.support,
                      value: String(appearance.count),
                    },
                  ]
                : [],
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
        title={copy.artistChart.empty.title}
        description={copy.artistChart.empty.description}
      />
    );
  }

  return (
    <section className="gigs-artists" aria-label={copy.artistChart.title}>
      <ul className="gigs-artists__legend" aria-label={copy.artistChart.legend}>
        <li>
          <span className="gigs-artists__key gigs-artists__key--main" />
          {copy.artistChart.types.main}
        </li>
        <li>
          <span className="gigs-artists__key gigs-artists__key--support" />
          {copy.artistChart.types.support}
        </li>
      </ul>
      <Chart
        definition={definition}
        height={artists.length * 32 + 56}
        initialWidth={720}
        ariaLabel={copy.artistChart.title}
        ariaDescription={copy.artistChart.description}
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
                <p key={row.label}>{copy.artistChart.count(row.label, row.value)}</p>
              ))}
              <ol className="gigs-artists__events">
                {appearances?.map(({ event, role: appearanceRole }, index) => (
                  <li key={index}>
                    <strong>{formatDate(event.date)}</strong>
                    <p>{copy.formatVenue(event)}</p>
                    {appearanceRole === "Support" && (
                      <p className="gigs-artists__supported">
                        {copy.artistChart.supported(event.artists)}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              {pinned && (
                <div className="tooltip__actions">
                  <InternalLinkButton
                    from="/gigs/{-$breakdown}/"
                    to="/gigs/{-$breakdown}"
                    params={(params) => ({ ...params, breakdown: undefined })}
                    search={(search) => ({ ...search, artist: primaryPoint?.datum.artist })}
                    icon={<MdSymbol>filter_list</MdSymbol>}
                  >
                    {copy.artistChart.actions.filter}
                  </InternalLinkButton>
                  <Button variant="text" onClick={dismiss}>
                    {copy.artistChart.actions.close}
                  </Button>
                </div>
              )}
            </div>
          );
        }}
      />
      <div className="gigs-artists__table">
        <table>
          <caption>{copy.artistChart.table.title}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.artistChart.table.columns.artist}</th>
              <th scope="col">{copy.artistChart.table.columns.main}</th>
              <th scope="col">{copy.artistChart.table.columns.support}</th>
              <th scope="col">{copy.artistChart.table.columns.total}</th>
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
