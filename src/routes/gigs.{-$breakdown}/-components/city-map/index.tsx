import { defineChart, type ChartBounds } from "@tanstack/charts";
import { geoShape } from "@tanstack/charts/geo";
import { decorative } from "@tanstack/charts/mark/decorative";
import { Chart } from "@tanstack/charts/react/tooltip";
import { tooltip } from "@tanstack/charts/tooltip";
import { portal } from "@tanstack/charts/tooltip/portal";
import { geoMercator } from "d3-geo";
import { useMemo } from "react";

import type { ArtistEvent } from "#/routes/gigs.{-$breakdown}/-components/artist-chart/data";
import { formatVenue } from "#/routes/gigs.{-$breakdown}/-components/venue-label";
import { Button } from "#/shared/components/buttons/button";
import { formatDate } from "#/shared/lib/date";

import { englandGeometry, getCityMapData, getCityMapFit } from "./data";

export function GigsCityMap({
  events,
}: {
  events: ReadonlyArray<ArtistEvent & { city: string; date: string; venue: string }>;
}) {
  const cities = useMemo(() => getCityMapData(events), [events]);
  const definition = useMemo(() => {
    const fit = getCityMapFit(cities);
    const padding = 35 + Math.max(0, ...cities.map(({ radius }) => radius));
    const projection = ({ chart }: { chart: ChartBounds }) => {
      const inset = Math.min(padding, Math.max(0, (Math.min(chart.width, chart.height) - 1) / 2));
      return geoMercator()
        .fitExtent(
          [
            [chart.x + inset, chart.y + inset],
            [chart.x + chart.width - inset, chart.y + chart.height - inset],
          ],
          fit,
        )
        .clipExtent([
          [chart.x + 0.5, chart.y + 0.5],
          [chart.x + chart.width - 0.5, chart.y + chart.height - 0.5],
        ]);
    };
    const features = cities.map((city) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: city.coordinates },
      properties: city,
    }));
    return defineChart({
      marks: [
        decorative(
          geoShape([englandGeometry], {
            projection,
            fill: "var(--md-sys-color-green-container)",
            stroke: "var(--md-sys-color-green)",
            strokeWidth: 1,
          }),
        ),
        geoShape(features, {
          projection,
          key: (feature) => feature.properties.city,
          r: (feature) => feature.properties.radius,
          fill: "var(--md-sys-color-primary)",
          stroke: "var(--md-sys-color-on-primary)",
          strokeWidth: 1,
          states: [
            {
              when: ({ datum, focus }) => datum === focus.primary.datum,
              style: { stroke: "var(--md-sys-color-on-surface)", strokeWidth: 3 },
            },
          ],
        }),
      ],
      scales: { x: null, y: null },
      margin: 0,
      tooltip: {
        use: tooltip,
        portal,
        sticky: true,
        content: (points) => {
          const city = points[0]?.datum.properties;
          return {
            title: city?.city ?? "",
            rows: city ? [{ label: "Gigs", value: String(city.count) }] : [],
          };
        },
      },
    });
  }, [cities]);

  if (!cities.length) return <p className="gigs-city-map">No cities recorded yet.</p>;

  return (
    <section className="gigs-city-map" aria-label="Gigs by city">
      <h2>Gigs by city</h2>
      <div className="gigs-city-map__map">
        <Chart
          definition={definition}
          height={520}
          initialWidth={720}
          ariaLabel="Map of England"
          ariaDescription="City dots show recorded gigs; their area is proportional to event count. Use arrow keys to explore cities and Enter to pin event details. A table of exact city counts follows for screen readers."
          renderTooltipBody={({ content, primaryPoint, pinned, dismiss }) =>
            typeof content === "string" ? (
              content
            ) : (
              <div className="tooltip--rich gigs-city-map__tooltip">
                <h3 className="tooltip__subhead">{content.title}</h3>
                <ul className="gigs-city-map__events">
                  {primaryPoint?.datum.properties.events.map((event, index) => (
                    <li key={index}>
                      <strong>{event.artists.join(", ")}</strong>
                      <p>{formatDate(event.date)}</p>
                      <p>{formatVenue(event)}</p>
                      {event.support?.length ? (
                        <p className="gigs-city-map__support">
                          Support: {event.support.join(", ")}
                        </p>
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
      </div>
      <div className="gigs-city-map__table">
        <table>
          <caption>Recorded gigs per city</caption>
          <thead>
            <tr>
              <th scope="col">City</th>
              <th scope="col">Gigs</th>
            </tr>
          </thead>
          <tbody>
            {cities.map(({ city, count }) => (
              <tr key={city}>
                <th scope="row">{city}</th>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
