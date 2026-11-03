import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import * as v from "valibot";

import { FilterChips } from "#/routes/gigs.{-$breakdown}/-components/filter-chips/index.tsx";
import { generatePageMetadata } from "#/shared/lib/document-head";

import { GigsArtistChart } from "./-components/artist-chart";
import { GigsCityMap } from "./-components/city-map";
import { GigsHeatmap } from "./-components/heatmap";
import { GigsBreakdownTabs } from "./-components/tabs";
import { GigsVenueChart } from "./-components/venue-chart";
import { formatVenue } from "./-components/venue-label";
import { gigBreakdownSchema } from "./-constants";
import gigs from "./-data/gigs.json";
import GigsIntro from "./-intro.mdx";

import breakdownCss from "./index.css?url";

const paramsSchema = v.object({
  breakdown: v.optional(gigBreakdownSchema),
});

const searchSchema = v.object({
  artist: v.optional(v.string()),
  city: v.optional(v.string()),
  venue: v.optional(v.string()),
});

export const Route = createFileRoute("/gigs/{-$breakdown}/")({
  params: {
    parse: (params) => v.parse(paramsSchema, params),
  },
  validateSearch: searchSchema,
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
  const { artist, city, venue } = Route.useSearch();
  const filteredGigs = useMemo(
    () =>
      gigs.events.filter((gig) => {
        if (artist && !(gig.artists.includes(artist) || gig.support?.includes(artist)))
          return false;
        if (city && gig.city !== city) return false;
        if (venue && formatVenue(gig) !== venue) return false;
        return true;
      }),
    [artist, city, venue],
  );
  return (
    <main>
      <div className="gigs-intro">
        <GigsIntro />
      </div>
      <FilterChips {...{ artist, city, venue }} />
      <GigsBreakdownTabs />
      <div className="tabs__route-content">
        {breakdown === "by-month" && <GigsHeatmap events={filteredGigs} />}
        {breakdown === "by-artist" && <GigsArtistChart events={filteredGigs} />}
        {breakdown === "by-venue" && <GigsVenueChart events={filteredGigs} />}
        {breakdown === "by-city" && <GigsCityMap events={filteredGigs} />}
      </div>
    </main>
  );
}
