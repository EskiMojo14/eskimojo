import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { MusicPeriodPicker } from "#/routes/music/-components/period-picker";
import { RecentTracks } from "#/routes/music/-components/recent-tracks";
import { MusicBreakdownTabs } from "#/routes/music/-components/tabs";
import { MusicTopList } from "#/routes/music/-components/top-list";
import { musicBreakdownSchema } from "#/routes/music/-constants";
import {
  getRecentTracks,
  getTopTracks,
  getTopArtists,
  periodSchema,
} from "#/routes/music/-query.ts";

import recentTracksCss from "#/routes/music/-components/recent-tracks.css?url";

export const Route = createFileRoute("/music/{-$breakdown}/")({
  params: {
    parse: v.parser(v.object({ breakdown: v.optional(musicBreakdownSchema) })),
  },
  staticData: { title: "Music" },
  validateSearch: v.object({
    period: v.optional(periodSchema),
  }),
  loaderDeps: ({ search: { period } }) => ({ period }),
  loader: async ({
    context: { queryClient },
    params: { breakdown = "recent" },
    deps: { period = "7day" },
  }) => {
    if (breakdown === "recent") {
      await queryClient.query({ ...getRecentTracks({ limit: 10 }), staleTime: "static" });
    } else if (breakdown === "top-artists") {
      await queryClient.query({ ...getTopArtists({ limit: 10, period }), staleTime: "static" });
    } else {
      await queryClient.query({ ...getTopTracks({ limit: 10, period }), staleTime: "static" });
    }
  },
  head: () => ({
    links: [{ rel: "stylesheet", href: recentTracksCss }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { breakdown = "recent" } = Route.useParams();
  return (
    <>
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
