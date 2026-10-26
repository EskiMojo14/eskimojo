import * as v from "valibot";

export const musicBreakdownSchema = v.fallback(v.picklist(["top-music", "recent"]), "top-music");
export type MusicBreakdown = v.InferOutput<typeof musicBreakdownSchema>;

export const musicBreakdownLabels: Record<MusicBreakdown, { label: string; icon: string }> = {
  "top-music": { label: "Top music", icon: "music_note" },
  recent: { label: "Recently played", icon: "history" },
};
