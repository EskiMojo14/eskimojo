import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

import { generatePageMetadata } from "#/shared/lib/document-head";

import { GigsArtistChart } from "./-components/artist-chart";
import { GigsCityMap } from "./-components/city-map";
import { GigsHeatmap } from "./-components/heatmap";
import { GigsBreakdownTabs } from "./-components/tabs";
import { GigsVenueChart } from "./-components/venue-chart";
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
  head: () => {
    const metadata = generatePageMetadata({
      title: "Gigs",
      description: "Explore eskimojo's live gig history by month, artist, venue, and city.",
    });
    return {
      ...metadata,
      links: [...metadata.links, { rel: "stylesheet", href: breakdownCss }],
    };
  },
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
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
      {breakdown === "by-venue" && <GigsVenueChart events={gigs.events} />}
      {breakdown === "by-city" && <GigsCityMap events={gigs.events} />}
    </>
  );
}
