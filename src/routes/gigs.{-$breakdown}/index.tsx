import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { GigsBreakdownTabs } from "./-components/tabs";
import { gigBreakdownSchema } from "./-constants";
import GigsIntro from "./-intro.mdx";

import breakdownCss from "./index.css?url";

const paramsSchema = v.object({
  breakdown: v.optional(gigBreakdownSchema),
});

export const Route = createFileRoute("/gigs/{-$breakdown}/")({
  params: {
    parse: v.parser(paramsSchema),
  },
  staticData: { title: "Gigs" },
  component: RouteComponent,
  head: () => ({
    links: [{ rel: "stylesheet", href: breakdownCss }],
  }),
});

function RouteComponent() {
  return (
    <>
      <div className="gigs-intro">
        <GigsIntro />
      </div>
      <GigsBreakdownTabs />
    </>
  );
}
