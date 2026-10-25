import * as v from "valibot";

export const gigBreakdownSchema = v.fallback(
  v.picklist(["by-month", "by-artist", "by-venue", "by-city"]),
  "by-month",
);
export type GigBreakdown = v.InferOutput<typeof gigBreakdownSchema>;
export const gigBreakdownLabels: Record<GigBreakdown, { label: string; icon: string }> = {
  "by-month": { label: "Month", icon: "calendar_month" },
  "by-artist": { label: "Artist", icon: "artist" },
  "by-venue": { label: "Venue", icon: "stadium" },
  "by-city": { label: "City", icon: "location_city" },
};
