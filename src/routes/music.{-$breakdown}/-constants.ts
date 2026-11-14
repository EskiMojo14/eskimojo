import * as v from "valibot";

export const periodSchema = v.fallback(
  v.picklist(["7day", "1month", "3month", "6month", "12month", "overall"]),
  "overall",
);
export type Period = v.InferOutput<typeof periodSchema>;

export const musicBreakdownSchema = v.fallback(v.picklist(["top-music", "recent"]), "top-music");
export type MusicBreakdown = v.InferOutput<typeof musicBreakdownSchema>;

export const musicBreakdownLabels: Record<MusicBreakdown, { label: string; icon: string }> = {
  "top-music": { label: "Top music", icon: "music_note" },
  recent: { label: "Recently played", icon: "history" },
};
