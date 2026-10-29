import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import * as v from "valibot";

import {
  MusicDataBoundary,
  MusicRefreshNotice,
} from "#/routes/music.{-$breakdown}/-components/data-boundary";
import { MusicPeriodPicker } from "#/routes/music.{-$breakdown}/-components/period-picker/index";
import {
  RecentTracks,
  RecentTracksSkeleton,
} from "#/routes/music.{-$breakdown}/-components/recent-tracks/index";
import {
  MusicSummary,
  MusicSummarySkeleton,
} from "#/routes/music.{-$breakdown}/-components/summary/index";
import { MusicBreakdownTabs } from "#/routes/music.{-$breakdown}/-components/tabs/index";
import {
  MusicTopMusic,
  MusicTopMusicSkeleton,
} from "#/routes/music.{-$breakdown}/-components/top-music/index";
import { musicBreakdownSchema } from "#/routes/music.{-$breakdown}/-constants.ts";
import {
  getRecentTracks,
  getTopTracks,
  getTopArtists,
  getUserData,
  periodSchema,
} from "#/routes/music.{-$breakdown}/-query.ts";
import { generatePageMetadata } from "#/shared/lib/document-head";

import dataBoundaryCss from "#/routes/music.{-$breakdown}/-components/data-boundary/index.css?url";
import recentTracksCss from "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css?url";
import skeletonCss from "#/routes/music.{-$breakdown}/-components/skeletons/index.css?url";
import summaryCss from "#/routes/music.{-$breakdown}/-components/summary/index.css?url";

const recentTracksRefreshInterval = 60_000;

function reportPreloadError(error: unknown) {
  console.error("Failed to preload music data.", error);
}

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
  }),
  loaderDeps: ({ search: { period } }) => ({ period }),
  loader: ({
    context: { queryClient },
    params: { breakdown = musicBreakdownSchema.fallback },
    deps: { period = periodSchema.fallback },
  }) => {
    queryClient.query({ ...getUserData(), staleTime: "static" }).catch(reportPreloadError);
    switch (breakdown) {
      case "recent":
        queryClient
          .query({
            ...getRecentTracks({ limit: 10 }),
            staleTime: recentTracksRefreshInterval,
          })
          .catch(reportPreloadError);
        break;
      case "top-music":
        queryClient
          .query({ ...getTopTracks({ limit: 10, period }), staleTime: "static" })
          .catch(reportPreloadError);
        queryClient
          .query({ ...getTopArtists({ limit: 10, period }), staleTime: "static" })
          .catch(reportPreloadError);
        break;
    }
  },
  head: () => {
    const metadata = generatePageMetadata({
      title: "Music",
      description:
        "See what eskimojo is listening to, with recent tracks and top music from Last.fm.",
    });
    return {
      ...metadata,
      links: [
        ...metadata.links,
        { rel: "stylesheet", href: recentTracksCss },
        { rel: "stylesheet", href: summaryCss },
        { rel: "stylesheet", href: skeletonCss },
        { rel: "stylesheet", href: dataBoundaryCss },
      ],
    };
  },
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  const { breakdown = musicBreakdownSchema.fallback } = Route.useParams();
  const { period = periodSchema.fallback } = Route.useSearch();
  return (
    <>
      <MusicDataBoundary
        loading={<MusicSummarySkeleton />}
        errorTitle="Couldn't load listening statistics"
      >
        <SummaryPanel />
      </MusicDataBoundary>
      <MusicBreakdownTabs />
      <div className="tabs__route-content">
        {breakdown !== "recent" && <MusicPeriodPicker />}
        <MusicDataBoundary
          resetKey={breakdown === "recent" ? breakdown : `${breakdown}:${period}`}
          loading={breakdown === "recent" ? <RecentTracksSkeleton /> : <MusicTopMusicSkeleton />}
          errorTitle={
            breakdown === "recent" ? "Couldn't load recent tracks" : "Couldn't load top music"
          }
        >
          {breakdown === "recent" && <RecentTracksPanel />}
          {breakdown === "top-music" && <TopMusicPanel />}
        </MusicDataBoundary>
      </div>
    </>
  );
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function SummaryPanel() {
  const { data: user, dataUpdatedAt } = useSuspenseQuery({
    ...getUserData(),
    staleTime: "static",
  });
  return <MusicSummary user={user} asOf={dataUpdatedAt} />;
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RecentTracksPanel() {
  const {
    data: recentTracks,
    error,
    isRefetchError,
    isFetching,
    refetch,
  } = useSuspenseQuery({
    ...getRecentTracks({ limit: 10 }),
    staleTime: recentTracksRefreshInterval,
    refetchInterval: recentTracksRefreshInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  });
  useEffect(() => {
    if (isRefetchError) console.error("Failed to refresh recent tracks.", error);
  }, [error, isRefetchError]);
  return (
    <>
      {isRefetchError && (
        <MusicRefreshNotice
          isFetching={isFetching}
          onRetry={() => {
            refetch().catch((retryError: unknown) =>
              console.error("Failed to retry recent tracks.", retryError),
            );
          }}
        />
      )}
      <RecentTracks tracks={recentTracks} />
    </>
  );
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function TopMusicPanel() {
  const { period = periodSchema.fallback } = Route.useSearch();
  const [tracks, artists] = useSuspenseQueries({
    queries: [
      { ...getTopTracks({ limit: 10, period }), staleTime: "static" },
      { ...getTopArtists({ limit: 10, period }), staleTime: "static" },
    ],
  });
  return <MusicTopMusic tracks={tracks.data} artists={artists.data} />;
}
