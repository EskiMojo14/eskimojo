import { cell, defineChart, text } from "@tanstack/charts";
import type { ChartPoint, ChartRenderContext } from "@tanstack/charts";
import { decorative } from "@tanstack/charts/mark/decorative";
import { Chart } from "@tanstack/charts/react/tooltip";
import { scaleBand } from "@tanstack/charts/scales/band";
import { tooltip } from "@tanstack/charts/tooltip";
import { portal } from "@tanstack/charts/tooltip/portal";
import { useMemo, useRef } from "react";

import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import type { GigEvent } from "#/routes/gigs.{-$breakdown}/-data/gigs.gen";
import { Button } from "#/shared/components/buttons/button";
import { EmptyState } from "#/shared/components/empty-state";
import { MdSymbol } from "#/shared/components/symbol";
import { formatDate } from "#/shared/lib/date";

import { getGigHeatmapData, type GigMonth } from "./data";

interface HeatmapEvent extends Pick<GigEvent, "date" | "venue" | "city"> {
  artists: ReadonlyArray<string>;
  support?: ReadonlyArray<string>;
}

export function GigsHeatmap({ events }: { events: ReadonlyArray<HeatmapEvent> }) {
  const chartContext = useRef<ChartRenderContext<GigMonth<HeatmapEvent>, string, string> | null>(
    null,
  );

  const focusedPoint = useRef<ChartPoint<GigMonth<HeatmapEvent>, string, string> | null>(null);
  const { years, cells, maxCount, total } = useMemo(() => getGigHeatmapData(events), [events]);

  const cellColors = useMemo(
    () =>
      Array.from(
        { length: maxCount + 1 },
        (_, count) =>
          `color-mix(in srgb, var(--md-sys-color-primary-container) ${
            maxCount === 0 ? 0 : (count / maxCount) * 100
          }%, var(--md-sys-color-surface-container))`,
      ),
    [maxCount],
  );

  const definition = useMemo(
    () =>
      defineChart({
        focusRing: false,
        marks: [
          cell(cells, {
            x: "month",
            y: "year",
            color: "count",
            key: (row) => `${row.year}-${row.month}`,
            inset: 2,
            states: [
              {
                when: ({ datum, focus }) => datum === focus.primary.datum,
                style: {
                  stroke: "var(--md-sys-color-on-surface)",
                  strokeWidth: 2,
                },
              },
            ],
          }),
          decorative(
            text(cells, {
              x: "month",
              y: "year",
              text: (row) => String(row.count),
              fill: (row) => `contrast-color(${cellColors[row.count]})`,
            }),
          ),
        ],
        scales: {
          x: {
            scale: () => scaleBand().domain(copy.heatmapChart.months),
            side: "top",
          },
          y: {
            scale: () => scaleBand().domain(years),
          },
        },
        color: {
          domain: Array.from({ length: maxCount + 1 }, (_, count) => count),
          range: cellColors,
        },
        tooltip: {
          use: tooltip,
          portal,
          sticky: true,
          content: (points) => {
            const month = points[0]?.datum;

            return {
              title: month ? copy.heatmapChart.monthTitle(month.month, month.year) : "",
              rows: month?.events.length
                ? month.events.map((event) => ({
                    label: event.artists.join(", "),
                    value: [
                      formatDate(event.date),
                      copy.formatVenue(event),
                      ...(event.support?.length ? [copy.heatmapChart.support(event.support)] : []),
                    ].join("\n"),
                  }))
                : [{ label: copy.heatmapChart.empty.month, value: "" }],
            };
          },
        },
      }),
    [cells, years, maxCount, cellColors],
  );

  if (total === 0) {
    return (
      <EmptyState
        icon={<MdSymbol>event</MdSymbol>}
        title={copy.heatmapChart.empty.title}
        description={copy.heatmapChart.empty.description}
      />
    );
  }

  return (
    <section className="gigs-heatmap" aria-label={copy.heatmapChart.title}>
      <div
        className="gigs-heatmap__chart"
        onKeyDownCapture={(event) => {
          const context = chartContext.current;
          const current = focusedPoint.current;

          if (
            !context ||
            !current ||
            event.target !== context.svg ||
            event.defaultPrevented ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          )
            return;
          const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
          const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";

          if (!horizontal && !vertical) return;
          const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
          const origin = context.scene.points.find((point) => point.key === current.key);

          if (!origin) return;
          const axis = horizontal ? "x" : "y";
          const crossAxis = horizontal ? "y" : "x";

          const next = context.scene.points
            .filter(
              (point) =>
                Math.abs(point[crossAxis] - origin[crossAxis]) < 1 &&
                (point[axis] - origin[axis]) * direction > 1,
            )
            .toSorted(
              (left, right) =>
                Math.abs(left[axis] - origin[axis]) - Math.abs(right[axis] - origin[axis]),
            )[0];

          event.stopPropagation();

          if (!next) return;
          event.preventDefault();
          context.interaction.setControlledFocus(next);
          context.svg.scrollIntoView({ block: "nearest", inline: "nearest" });
        }}
      >
        <Chart
          definition={definition}
          height={years.length * 36 + 56}
          initialWidth={720}
          onRender={(context) => {
            chartContext.current = context;
          }}
          onFocusChange={(point) => {
            focusedPoint.current = point;
          }}
          ariaLabel={copy.heatmapChart.title}
          ariaDescription={copy.heatmapChart.description}
          renderTooltipBody={({ content, primaryPoint, pinned, dismiss }) =>
            typeof content === "string" ? (
              content
            ) : (
              <div className="tooltip--rich tooltip--chart gigs-heatmap__tooltip">
                <h3 className="tooltip__subhead">{content.title}</h3>
                <ol className="gigs-heatmap__events">
                  {primaryPoint?.datum.events.map((event, index) => (
                    <li key={index}>
                      <strong>{event.artists.join(", ")}</strong>
                      <p>
                        {formatDate(event.date)}
                        {"\n"}
                        {copy.formatVenue(event)}
                      </p>
                      {event.support?.length ? (
                        <p className="gigs-heatmap__support">
                          {copy.heatmapChart.support(event.support)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                  {!primaryPoint?.datum.events.length && <li>{copy.heatmapChart.empty.month}</li>}
                </ol>
                {pinned && (
                  <div className="tooltip__actions">
                    <Button variant="text" onClick={dismiss}>
                      {copy.heatmapChart.actions.close}
                    </Button>
                  </div>
                )}
              </div>
            )
          }
        />
      </div>
      <div className="gigs-heatmap__table">
        <table>
          <caption>{copy.heatmapChart.table.title}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.heatmapChart.table.year}</th>
              {copy.heatmapChart.months.map((month) => (
                <th scope="col" key={month}>
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <th scope="row">{year}</th>
                {cells
                  .filter((row) => row.year === year)
                  .map((row) => (
                    <td key={row.month}>{row.count}</td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
