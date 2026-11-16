import { createFileRoute, redirect } from "@tanstack/react-router";
import * as v from "valibot";

import { periodSchema } from "#/routes/music.{-$breakdown}/-constants";

export const Route = createFileRoute("/music/top")({
  validateSearch: v.object({ period: v.optional(periodSchema) }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/music/{-$breakdown}/{-$type}",
      params: { breakdown: "top", type: "tracks" },
      search: { period: search.period },
      replace: true,
    });
  },
});
