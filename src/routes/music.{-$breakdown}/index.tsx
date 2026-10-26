import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { MusicPeriodPicker } from "#/routes/music.{-$breakdown}/-components/period-picker";
import { RecentTracks } from "#/routes/music.{-$breakdown}/-components/recent-tracks";
import { MusicSummary } from "#/routes/music.{-$breakdown}/-components/summary";
import { MusicBreakdownTabs } from "#/routes/music.{-$breakdown}/-components/tabs";
import { MusicTopList } from "#/routes/music.{-$breakdown}/-components/top-list";
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
    params: { breakdown = "recent" },
    deps: { period = "7day" },
  }) => {
    await queryClient.query({ ...getUserData(), staleTime: "static" });
    if (breakdown === "recent") {
      await queryClient.query({ ...getRecentTracks({ limit: 10 }), staleTime: "static" });
    } else if (breakdown === "top-artists") {
      await queryClient.query({ ...getTopArtists({ limit: 10, period }), staleTime: "static" });
    } else {
      await queryClient.query({ ...getTopTracks({ limit: 10, period }), staleTime: "static" });
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
  const { breakdown = "recent" } = Route.useParams();
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
      {breakdown === "top-artists" && <TopArtistsPanel />}
      {breakdown === "top-tracks" && <TopTracksPanel />}
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

function TopArtistsPanel() {
  const { period = "7day" } = Route.useSearch();
  const { data } = useSuspenseQuery({
    ...getTopArtists({ limit: 10, period }),
    staleTime: "static",
  });
  return <MusicTopList title="Top artists" items={data} />;
}

function TopTracksPanel() {
  const { period = "7day" } = Route.useSearch();
  const { data } = useSuspenseQuery({
    ...getTopTracks({ limit: 10, period }),
    staleTime: "static",
  });
  return <MusicTopList title="Top tracks" items={data} />;
}
