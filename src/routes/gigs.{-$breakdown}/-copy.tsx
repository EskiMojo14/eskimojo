import type { GigBreakdown } from "#/routes/gigs.{-$breakdown}/-constants";
import { pluralize } from "#/utils/intl";

export const meta = {
  title: "Gigs",
  description: "Shows I've been to",
} as const;

export const tabs = {
  title: "Gigs breakdown",
  breakdown: {
    "by-month": { label: "Month", icon: "calendar_month" },
    "by-artist": { label: "Artist", icon: "artist" },
    "by-venue": { label: "Venue", icon: "stadium" },
    "by-city": { label: "City", icon: "location_city" },
  } as const satisfies Record<GigBreakdown, { label: string; icon: string }>,
} as const;

export function formatVenue({ venue, city }: { venue: string; city: string }) {
  return `${venue}, ${city}`;
}

export const artistChart = {
  title: "Gigs by artist",
  description:
    "One horizontal bar per artist, stacked by Main and Support appearances. Artists are sorted by Main appearances, then Support appearances, highest first. A table of exact counts follows for screen readers.",
  legend: "Appearance types",
  empty: {
    title: "No artists recorded yet.",
    description: "Artists will appear here when gigs are added to the archive.",
  },
  types: {
    main: "Main",
    support: "Support",
  },
  count: (role: string, value: string) => `${role}: ${value}`,
  supported: (artists: ReadonlyArray<string>) => `Supported ${artists.join(", ")}`,
  actions: {
    filter: "Filter",
    close: "Close details",
  },
  table: {
    title: "Recorded appearances per artist",
    columns: {
      artist: "Artist",
      main: "Main",
      support: "Support",
      total: "Total",
    },
  },
} as const;

export const cityChart = {
  title: "Gigs by city",
  label: "Map of England",
  description:
    "City dots show recorded gigs; their area is proportional to event count. Use arrow keys to explore cities and Enter to pin event details. A table of exact city counts follows for screen readers.",
  empty: {
    title: "No cities recorded yet.",
    description: "Cities will appear here when gigs are added to the archive.",
  },
  support: (support: ReadonlyArray<string>) => `Support: ${support.join(", ")}`,
  actions: {
    filter: "Filter",
    close: "Close details",
  },
  table: {
    title: "Recorded gigs per city",
    columns: {
      city: "City",
      gigs: "Gigs",
    },
  },
} as const;

export const heatmapChart = {
  title: "Gigs by month and year",
  description:
    "Columns are months from January to December. Rows are years in ascending order. Each cell shows the number of recorded gigs. A table of exact values follows for screen readers.",
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  monthTitle: (month: string, year: string) => `${month} ${year}`,
  empty: {
    title: "No gigs recorded yet.",
    description: "Your gig history will appear here when gigs are added to the archive.",
    month: "No gigs recorded this month.",
  },
  support: (support: ReadonlyArray<string>) => `Support: ${support.join(", ")}`,
  actions: { close: "Close details" },
  table: { title: "Recorded gigs per month and year", year: "Year" },
} as const;

export const venueChart = {
  title: "Gigs by venue",
  description:
    "One horizontal bar per venue, sorted by gig count, highest first. A table of exact counts follows for screen readers.",
  empty: {
    title: "No venues recorded yet.",
    description: "Venues will appear here when gigs are added to the archive.",
  },
  count: (count: number) => pluralize`${count} ${[count, "gig"]}`,
  missingCount: " gigs",
  support: (support: ReadonlyArray<string>) => `Support: ${support.join(", ")}`,
  actions: { filter: "Filter", close: "Close details" },
  table: {
    title: "Recorded gigs per venue",
    columns: { venue: "Venue", gigs: "Gigs" },
  },
} as const;

export const filters = {
  title: "Active gig filters",
} as const;
