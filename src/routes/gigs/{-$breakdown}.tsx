import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { gigBreakdownSchema } from "./-constants";

const paramsSchema = v.object({
  breakdown: v.optional(gigBreakdownSchema),
});

export const Route = createFileRoute("/gigs/{-$breakdown}")({
  params: {
    parse: v.parser(paramsSchema),
  },
  staticData: { title: "Gigs" },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
