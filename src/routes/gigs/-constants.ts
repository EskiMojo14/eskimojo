import * as v from "valibot";

export const gigBreakdownSchema = v.fallback(
  v.picklist(["by-month", "by-artist", "by-venue", "by-city"]),
  "by-month",
);
export type GigBreakdown = v.InferOutput<typeof gigBreakdownSchema>;
export const gigBreakdownLabels: Record<GigBreakdown, string> = {
  "by-month": "By month",
  "by-artist": "By artist",
  "by-venue": "By venue",
  "by-city": "By city",
};
