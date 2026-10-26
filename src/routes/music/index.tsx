import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import {
  getRecentTracks,
  getTopTracks,
  getTopArtists,
  periodSchema,
} from "#/routes/music/-query.ts";
import { promiseAllKeyed } from "#/utils/index.ts";

import { RecentTracks } from "./-components/recent-tracks";

import recentTracksCss from "./-components/recent-tracks.css?url";

export const Route = createFileRoute("/music/")({
  staticData: { title: "Music" },
  validateSearch: v.object({
    period: v.optional(periodSchema),
  }),
  loaderDeps: ({ search: { period } }) => ({ period }),
  loader: async ({ context: { queryClient }, deps: { period = "7day" } }) => {
    await promiseAllKeyed({
      recentTracks: queryClient.query({
        ...getRecentTracks({ limit: 10 }),
        staleTime: "static",
      }),
      topTracks: queryClient.query({
        ...getTopTracks({ limit: 10, period }),
        staleTime: "static",
      }),
      topArtists: queryClient.query({
        ...getTopArtists({ limit: 10, period }),
        staleTime: "static",
      }),
    });
  },
  head: () => ({
    links: [{ rel: "stylesheet", href: recentTracksCss }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { data: recentTracks } = useSuspenseQuery({
    ...getRecentTracks({ limit: 10 }),
    staleTime: "static",
  });
  return <RecentTracks tracks={recentTracks} />;
}
