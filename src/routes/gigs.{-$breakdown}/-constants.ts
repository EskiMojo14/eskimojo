import * as v from "valibot";

export const gigBreakdownSchema = v.fallback(
  v.picklist(["by-month", "by-artist", "by-venue", "by-city"]),
  "by-month",
);

export type GigBreakdown = v.InferOutput<typeof gigBreakdownSchema>;
