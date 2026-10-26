import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import {
  getRecentTracks,
  getTopTracks,
  getTopArtists,
  periodSchema,
} from "#/routes/music/-query.ts";
import { promiseAllKeyed } from "#/utils/index.ts";

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
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
