import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { GigsArtistChart } from "./-components/artist-chart";
import { GigsHeatmap } from "./-components/heatmap";
import { GigsBreakdownTabs } from "./-components/tabs";
import { gigBreakdownSchema } from "./-constants";
import gigs from "./-data/gigs.json";
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
  const { breakdown = "by-month" } = Route.useParams();
  return (
    <>
      <div className="gigs-intro">
        <GigsIntro />
      </div>
      <GigsBreakdownTabs />
      {breakdown === "by-month" && <GigsHeatmap events={gigs.events} />}
      {breakdown === "by-artist" && <GigsArtistChart events={gigs.events} />}
    </>
  );
}
