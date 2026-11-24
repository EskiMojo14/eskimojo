import type { ReactNode } from "react";

import type { MusicBreakdown, MusicType, Period } from "#/routes/music.{-$breakdown}/-constants.ts";
import { pluralize } from "#/utils/intl";

export const meta = {
  title: "Music",
  description: "What I listen to, according to Last.fm",
  subtitle: (
    <>
      Powered by{" "}
      <a href="https://www.last.fm/user/eskimojo14" target="_blank" rel="noopener noreferrer">
        Last.fm
      </a>
    </>
  ),
} as const;

export const tabs = {
  title: "Music breakdown",
  breakdown: {
    top: { label: "Top music", icon: "leaderboard" },
    recent: { label: "Recently played", icon: "history" },
  } as const satisfies Record<MusicBreakdown, { label: string; icon: string }>,
} as const;

export const topTabs = {
  title: "Top music rankings",
  type: {
    tracks: { label: "Tracks", icon: "music_note" },
    albums: { label: "Albums", icon: "album" },
    artists: { label: "Artists", icon: "artist" },
  } as const satisfies Record<MusicType, { label: string; icon: string }>,
} as const;

export const errors = {
  summary: "Couldn't load listening statistics",
  recent: "Couldn't load recent tracks",
  top: "Couldn't load top music",
  description: "Last.fm data is unavailable right now. Please try again.",
  refresh: "Couldn't refresh recent tracks. Showing the last loaded results.",
  retry: "Retry",
} as const;

export const summary = {
  title: "Listening statistics",
  loading: "Loading listening summary...",
  introduction: "I love music! So far I've listened to:",
  counts: {
    scrobbles: { label: "Scrobbles", icon: "music_history" },
    artists: { label: "Artists", icon: "artist" },
    albums: { label: "Albums", icon: "album" },
    tracks: { label: "Tracks", icon: "music_note" },
  },
  detail: (registered: ReactNode, average: ReactNode, averageCount: number) => (
    <>
      since {registered} (an average of {average} {pluralize`${[averageCount, "scrobble"]}`} per
      day), and that's just the ones Last.fm knows about.
    </>
  ),
} as const;

export const periods = {
  title: "Listening period",
  labels: {
    "7day": "7 days",
    "1month": "30 days",
    "3month": "3 months",
    "6month": "6 months",
    "12month": "12 months",
    overall: "All time",
  } as const satisfies Record<Period, string>,
} as const;

export const topMusic = {
  loading: "Loading top music...",
  titles: {
    tracks: "Top tracks",
    albums: "Top albums",
    artists: "Top artists",
  } as const satisfies Record<MusicType, string>,
  emptyTitle: "No listening data for this period.",
  emptyDescription: "Try choosing a different time period.",
  rank: (rank: number) => `Rank ${rank}`,
  playCount: (count: number) => pluralize`${count.toLocaleString("en-GB")} ${[count, "play"]}`,
} as const;

export const recentTracks = {
  loading: "Loading recent tracks...",
  emptyTitle: "No recently played tracks yet.",
  emptyDescription: "Your recently played tracks will appear here once you start listening.",
  nowPlaying: "Now playing",
  playedAt: (date: string) => `${date} UTC`,
} as const;

export const search = {
  spotify: {
    label: "Spotify",
    accessibleLabel: (query: string) => `Search Spotify for ${query}`,
  },
  youtube: {
    label: "YouTube",
    accessibleLabel: (query: string) => `Search YouTube for ${query}`,
  },
} as const;
