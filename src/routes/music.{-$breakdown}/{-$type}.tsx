import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import * as v from "valibot";

import { MusicDataBoundary } from "#/routes/music.{-$breakdown}/-components/data-boundary";
import {
  RecentTracksPanel,
  SummaryPanel,
  TopAlbumsPanel,
  TopArtistsPanel,
  TopTracksPanel,
} from "#/routes/music.{-$breakdown}/-components/panels";
import { MusicPeriodPicker } from "#/routes/music.{-$breakdown}/-components/period-picker/index";
import { RecentTracksSkeleton } from "#/routes/music.{-$breakdown}/-components/recent-tracks/index";
import { MusicSummarySkeleton } from "#/routes/music.{-$breakdown}/-components/summary/index";
import { MusicBreakdownTabs } from "#/routes/music.{-$breakdown}/-components/tabs/index";
import {
  MusicTopMusicSkeleton,
  MusicTopMusicTabs,
} from "#/routes/music.{-$breakdown}/-components/top-music/index";
import {
  musicBreakdownSchema,
  strictMusicBreakdownSchema,
  strictMusicTypeSchema,
  musicTypeSchema,
  periodSchema,
  type MusicBreakdown,
} from "#/routes/music.{-$breakdown}/-constants.ts";
import { preloadMusic } from "#/routes/music.{-$breakdown}/-loader";
import { TabLinkPanel } from "#/shared/components/tabs";
import { generatePageMetadata } from "#/shared/lib/document-head";

import * as copy from "./-copy";

import styles from "./index.css?url";

export const Route = createFileRoute("/music/{-$breakdown}/{-$type}")({
  params: {
    parse: (params) => {
      const parseResult = v.safeParse(
        v.object({
          breakdown: v.optional(strictMusicBreakdownSchema),
          type: v.optional(strictMusicTypeSchema),
        }),
        params,
      );

      if (!parseResult.success) throw notFound();

      return parseResult.output;
    },
  },
  staticData: {
    title: copy.meta.title,
    subtitle: copy.meta.subtitle,
  },
  validateSearch: v.object({
    period: v.optional(periodSchema),
  }),
  loaderDeps: ({ search: { period } }) => ({ period }),
  beforeLoad: ({ params, search }) => {
    const breakdown = params.breakdown === "recent" ? "recent" : "top";

    if (
      params.breakdown === undefined ||
      (breakdown === "top" && params.type === undefined) ||
      (breakdown === "recent" && params.type !== undefined)
    ) {
      throw redirect({
        to: "/music/{-$breakdown}/{-$type}",
        params: {
          breakdown,
          type: breakdown === "top" ? (params.type ?? musicTypeSchema.fallback) : undefined,
        },
        search: { period: search.period },
        replace: true,
      });
    }
  },
  loader: ({ context: { queryClient }, params, deps: { period = periodSchema.fallback } }) => {
    const breakdown: MusicBreakdown = params.breakdown === "recent" ? "recent" : "top";

    return preloadMusic({
      queryClient,
      breakdown,
      period,
      type: params.type ?? musicTypeSchema.fallback,
    });
  },
  head: () => {
    const metadata = generatePageMetadata(copy.meta);

    return {
      ...metadata,
      links: [...metadata.links, { rel: "stylesheet", href: styles }],
    };
  },
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  const { breakdown = musicBreakdownSchema.fallback, type = musicTypeSchema.fallback } =
    Route.useParams();

  const { period = periodSchema.fallback } = Route.useSearch();

  const TopMusicPanel = {
    tracks: TopTracksPanel,
    albums: TopAlbumsPanel,
    artists: TopArtistsPanel,
  }[type];

  return (
    <main>
      <MusicDataBoundary loading={<MusicSummarySkeleton />} errorTitle={copy.errors.summary}>
        <SummaryPanel />
      </MusicDataBoundary>
      <MusicBreakdownTabs />
      {musicBreakdownSchema.options.map((value) => (
        <TabLinkPanel
          key={value}
          id={`music-${value}-panel`}
          tabId={`music-${value}-tab`}
          hidden={breakdown !== value}
          className="music-panel tabs__route-content"
        >
          {breakdown === value && (
            <>
              {breakdown === "recent" ? (
                <MusicDataBoundary
                  resetKey={breakdown}
                  loading={<RecentTracksSkeleton />}
                  errorTitle={copy.errors.recent}
                >
                  <RecentTracksPanel />
                </MusicDataBoundary>
              ) : (
                <>
                  <MusicPeriodPicker />
                  <MusicTopMusicTabs />
                  <MusicDataBoundary
                    resetKey={`${breakdown}:${period}:${type}`}
                    loading={<MusicTopMusicSkeleton type={type} />}
                    errorTitle={copy.errors.top}
                  >
                    <TopMusicPanel />
                  </MusicDataBoundary>
                </>
              )}
            </>
          )}
        </TabLinkPanel>
      ))}
    </main>
  );
}
