import * as v from "valibot";

export const recentTracksRefreshInterval = 60_000;

export const periodSchema = v.fallback(
  v.picklist(["7day", "1month", "3month", "6month", "12month", "overall"]),
  "overall",
);

export type Period = v.InferOutput<typeof periodSchema>;

export const strictMusicTypeSchema = v.picklist(["tracks", "albums", "artists"]);
export const musicTypeSchema = v.fallback(strictMusicTypeSchema, "tracks");

export type MusicType = v.InferOutput<typeof musicTypeSchema>;

export const strictMusicBreakdownSchema = v.picklist(["top", "recent"]);
export const musicBreakdownSchema = v.fallback(strictMusicBreakdownSchema, "top");

export type MusicBreakdown = v.InferOutput<typeof musicBreakdownSchema>;
