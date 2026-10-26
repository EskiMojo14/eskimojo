import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { MusicPeriodPicker } from "#/routes/music.{-$breakdown}/-components/period-picker";
import { RecentTracks } from "#/routes/music.{-$breakdown}/-components/recent-tracks";
import { MusicSummary } from "#/routes/music.{-$breakdown}/-components/summary";
import { MusicBreakdownTabs } from "#/routes/music.{-$breakdown}/-components/tabs";
import { MusicTopMusic } from "#/routes/music.{-$breakdown}/-components/top-music";
import { musicBreakdownSchema } from "#/routes/music.{-$breakdown}/-constants.ts";
import {
  getRecentTracks,
  getTopTracks,
  getTopArtists,
  getUserData,
  periodSchema,
} from "#/routes/music.{-$breakdown}/-query.ts";

import recentTracksCss from "#/routes/music.{-$breakdown}/-components/recent-tracks.css?url";
import summaryCss from "#/routes/music.{-$breakdown}/-components/summary.css?url";

export const Route = createFileRoute("/music/{-$breakdown}/")({
  params: {
    parse: v.parser(v.object({ breakdown: v.optional(musicBreakdownSchema) })),
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
        await queryClient.query({ ...getRecentTracks({ limit: 10 }), staleTime: "static" });
        break;
      case "top-music":
        await Promise.all([
          queryClient.query({ ...getTopTracks({ limit: 10, period }), staleTime: "static" }),
          queryClient.query({ ...getTopArtists({ limit: 10, period }), staleTime: "static" }),
        ]);
        break;
    }
  },
  head: () => ({
    links: [
      { rel: "stylesheet", href: recentTracksCss },
      { rel: "stylesheet", href: summaryCss },
    ],
  }),
  component: RouteComponent,
});

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
      {breakdown !== "recent" && <MusicPeriodPicker />}
      {breakdown === "recent" && <RecentTracksPanel />}
      {breakdown === "top-music" && <TopMusicPanel />}
    </>
  );
}

function RecentTracksPanel() {
  const { data: recentTracks } = useSuspenseQuery({
    ...getRecentTracks({ limit: 10 }),
    staleTime: "static",
  });
  return <RecentTracks tracks={recentTracks} />;
}

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
