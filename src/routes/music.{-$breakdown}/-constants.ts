import * as v from "valibot";

export const musicBreakdownSchema = v.fallback(
  v.picklist(["top-tracks", "top-artists", "recent"]),
  "top-tracks",
);
export type MusicBreakdown = v.InferOutput<typeof musicBreakdownSchema>;

export const musicBreakdownLabels: Record<MusicBreakdown, { label: string; icon: string }> = {
  "top-tracks": { label: "Top tracks", icon: "music_note" },
  "top-artists": { label: "Top artists", icon: "artist" },
  recent: { label: "Recent", icon: "history" },
};
