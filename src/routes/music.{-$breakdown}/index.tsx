import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { MusicPeriodPicker } from "#/routes/music.{-$breakdown}/-components/period-picker/index";
import { RecentTracks } from "#/routes/music.{-$breakdown}/-components/recent-tracks/index";
import { MusicSummary } from "#/routes/music.{-$breakdown}/-components/summary/index";
import { MusicBreakdownTabs } from "#/routes/music.{-$breakdown}/-components/tabs/index";
import { MusicTopMusic } from "#/routes/music.{-$breakdown}/-components/top-music/index";
import { musicBreakdownSchema } from "#/routes/music.{-$breakdown}/-constants.ts";
import {
  getRecentTracks,
  getTopTracks,
  getTopArtists,
  getUserData,
  periodSchema,
} from "#/routes/music.{-$breakdown}/-query.ts";
import { generatePageMetadata } from "#/shared/lib/document-head";

import recentTracksCss from "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css?url";
import summaryCss from "#/routes/music.{-$breakdown}/-components/summary/index.css?url";

const recentTracksRefreshInterval = 60_000;

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
  loader: async ({
    context: { queryClient },
    params: { breakdown = musicBreakdownSchema.fallback },
    deps: { period = periodSchema.fallback },
  }) => {
    await queryClient.query({ ...getUserData(), staleTime: "static" });
    switch (breakdown) {
      case "recent":
        await queryClient.query({
          ...getRecentTracks({ limit: 10 }),
          staleTime: recentTracksRefreshInterval,
        });
        break;
      case "top-music":
        await Promise.all([
          queryClient.query({ ...getTopTracks({ limit: 10, period }), staleTime: "static" }),
          queryClient.query({ ...getTopArtists({ limit: 10, period }), staleTime: "static" }),
        ]);
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
      ],
    };
  },
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  const { breakdown = musicBreakdownSchema.fallback } = Route.useParams();
  const { data: user, dataUpdatedAt } = useSuspenseQuery({
    ...getUserData(),
    staleTime: "static",
  });
  return (
    <>
      <MusicSummary user={user} asOf={dataUpdatedAt} />
      <MusicBreakdownTabs />
      <div className="tabs__route-content">
        {breakdown !== "recent" && <MusicPeriodPicker />}
        {breakdown === "recent" && <RecentTracksPanel />}
        {breakdown === "top-music" && <TopMusicPanel />}
      </div>
    </>
  );
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RecentTracksPanel() {
  const { data: recentTracks } = useSuspenseQuery({
    ...getRecentTracks({ limit: 10 }),
    staleTime: recentTracksRefreshInterval,
    refetchInterval: recentTracksRefreshInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  });
  return <RecentTracks tracks={recentTracks} />;
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
