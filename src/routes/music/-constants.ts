import * as v from "valibot";

export const musicBreakdownSchema = v.fallback(
  v.picklist(["recent", "top-artists", "top-tracks"]),
  "recent",
);
export type MusicBreakdown = v.InferOutput<typeof musicBreakdownSchema>;

export const musicBreakdownLabels: Record<MusicBreakdown, { label: string; icon: string }> = {
  recent: { label: "Recent", icon: "history" },
  "top-artists": { label: "Top artists", icon: "artist" },
  "top-tracks": { label: "Top tracks", icon: "music_note" },
};
