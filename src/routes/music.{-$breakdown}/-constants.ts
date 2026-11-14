import * as v from "valibot";

export const periodSchema = v.fallback(
  v.picklist(["7day", "1month", "3month", "6month", "12month", "overall"]),
  "overall",
);
export type Period = v.InferOutput<typeof periodSchema>;

export const musicTypeSchema = v.fallback(v.picklist(["tracks", "artists"]), "tracks");
export type MusicType = v.InferOutput<typeof musicTypeSchema>;

export const musicTypeLabels: Record<MusicType, { label: string; icon: string }> = {
  tracks: { label: "Tracks", icon: "music_note" },
  artists: { label: "Artists", icon: "artist" },
};

export const musicBreakdownSchema = v.fallback(v.picklist(["top-music", "recent"]), "top-music");
export type MusicBreakdown = v.InferOutput<typeof musicBreakdownSchema>;

export const musicBreakdownLabels: Record<MusicBreakdown, { label: string; icon: string }> = {
  "top-music": { label: "Top music", icon: "leaderboard" },
  recent: { label: "Recently played", icon: "history" },
};
