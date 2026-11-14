import { createFileRoute } from "@tanstack/react-router";
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
  musicTypeSchema,
  periodSchema,
} from "#/routes/music.{-$breakdown}/-constants.ts";
import { preloadMusic } from "#/routes/music.{-$breakdown}/-loader";
import { TabLinkPanel } from "#/shared/components/tabs";
import { generatePageMetadata } from "#/shared/lib/document-head";

import styles from "./index.css?url";

export const Route = createFileRoute("/music/{-$breakdown}/")({
  params: {
    parse: (params) => v.parse(v.object({ breakdown: v.optional(musicBreakdownSchema) }), params),
  },
  staticData: {
    title: "Music",
    subtitle: (
      <>
        Powered by{" "}
        <a href="https://www.last.fm/user/eskimojo14" target="_blank" rel="noopener noreferrer">
          Last.fm
        </a>
      </>
    ),
  },
  validateSearch: v.object({
    period: v.optional(periodSchema),
    type: v.optional(musicTypeSchema, musicTypeSchema.fallback),
  }),
  loaderDeps: ({ search: { period, type } }) => ({ period, type }),
  loader: ({
    context: { queryClient },
    params: { breakdown = musicBreakdownSchema.fallback },
    deps: { period = periodSchema.fallback, type },
  }) => preloadMusic({ queryClient, breakdown, period, type }),
  head: () => {
    const metadata = generatePageMetadata({
      title: "Music",
      description:
        "See what eskimojo is listening to, with recent tracks and top music from Last.fm.",
    });
    return {
      ...metadata,
      links: [...metadata.links, { rel: "stylesheet", href: styles }],
    };
  },
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  const { breakdown = musicBreakdownSchema.fallback } = Route.useParams();
  const { period = periodSchema.fallback, type } = Route.useSearch();
  const TopMusicPanel = {
    tracks: TopTracksPanel,
    albums: TopAlbumsPanel,
    artists: TopArtistsPanel,
  }[type];
  return (
    <main>
      <MusicDataBoundary
        loading={<MusicSummarySkeleton />}
        errorTitle="Couldn't load listening statistics"
      >
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
                  errorTitle="Couldn't load recent tracks"
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
                    errorTitle="Couldn't load top music"
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
