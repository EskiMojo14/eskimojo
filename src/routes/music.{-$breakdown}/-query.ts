import { queryOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import * as v from "valibot";

import { anyAbortSignal } from "#/utils/index.ts";
import * as vUtils from "#/utils/valibot";

import { addArtworkPalettes } from "./-artwork-palette.server";
import { periodSchema, type Period } from "./-constants";
import { addLastfmArtworkFallback, fetchLastfm, imageSchema, withLastfmArtwork } from "./-lastfm";
import {
  addLastfmArtistArtwork,
  addLastfmTrackArtwork,
  getLastfmArtworkRetryAfter,
} from "./-lastfm-artwork.server";

export { periodSchema, type Period } from "./-constants";

export type Artwork = { imageUrl: string };

export type ArtworkPalette = Record<`--artwork-${string}`, string>;

const itemSchema = v.pipe(
  v.object({
    "#text": v.string(),
  }),
  v.transform((item) => item["#text"]),
);

const commonRecentTrackSchema = v.object({
  name: v.string(),
  image: v.optional(imageSchema),
  artist: itemSchema,
  album: itemSchema,
});

export const recentTrackSchema = v.union([
  v.pipe(
    v.object({
      ...commonRecentTrackSchema.entries,
      date: v.pipe(
        v.object({
          // seconds since unix epoch
          uts: v.string(),
        }),
        v.transform(({ uts }) => new Date(Number(uts) * 1000).toISOString()),
      ),
    }),
    v.transform((track) => ({
      ...withLastfmArtwork(track),
      nowPlaying: false as const,
    })),
  ),
  v.pipe(
    v.object({
      ...commonRecentTrackSchema.entries,
      date: v.optional(v.never()),
      "@attr": v.object({
        nowplaying: v.literal("true"),
      }),
    }),
    v.transform(({ "@attr": _attr, ...track }) => ({
      ...withLastfmArtwork(track),
      nowPlaying: true as const,
    })),
  ),
]);

export type RecentTrack = v.InferOutput<typeof recentTrackSchema> & {
  lastfmArtworkUrl?: string;
  artwork?: Artwork;
  palette?: ArtworkPalette;
};

const musicArtworkParams = v.object({
  tracks: v.pipe(
    v.array(
      v.object({
        name: v.string(),
        artist: v.string(),
        lastfmArtworkUrl: v.optional(v.pipe(v.string(), v.maxLength(2048))),
      }),
    ),
    v.maxLength(11),
  ),
  artists: v.pipe(
    v.array(
      v.object({
        name: v.string(),
        lastfmArtworkUrl: v.optional(v.pipe(v.string(), v.maxLength(2048))),
      }),
    ),
    v.maxLength(10),
  ),
});

const musicArtworkCacheDuration = 6 * 60 * 60 * 1000;
const musicArtworkRetryDelay = 30_000;

export const resolveMusicArtwork = createServerOnlyFn(
  async (data: v.InferOutput<typeof musicArtworkParams>, signal: AbortSignal) => {
    const tracksWithArtwork = addLastfmArtworkFallback(data.tracks);
    const artistsWithArtwork = addLastfmArtworkFallback(data.artists);
    const [trackArtwork, artistArtwork] = await Promise.all([
      addLastfmTrackArtwork(tracksWithArtwork, signal),
      addLastfmArtistArtwork(artistsWithArtwork, signal),
    ]);
    const [tracks, artists] = await Promise.all([
      addArtworkPalettes(trackArtwork.items, signal),
      addArtworkPalettes(artistArtwork.items, signal),
    ]);
    return {
      tracks,
      artists,
      retryAfterMs:
        trackArtwork.incomplete || artistArtwork.incomplete
          ? Math.max(musicArtworkRetryDelay, getLastfmArtworkRetryAfter() ?? 0)
          : undefined,
    };
  },
);

export const getMusicArtworkFn = createServerFn({ method: "POST" })
  .validator(musicArtworkParams)
  .handler(({ data }) => resolveMusicArtwork(data, getRequest().signal));

export const getMusicArtwork = (
  params: v.InferInput<typeof musicArtworkParams>,
  signalOpt?: AbortSignal,
) =>
  queryOptions({
    queryKey: ["music-artwork", params],
    queryFn: async ({ signal }): Promise<Awaited<ReturnType<typeof getMusicArtworkFn>>> => {
      if (params.tracks.length === 0 && params.artists.length === 0) {
        return { tracks: [], artists: [], retryAfterMs: undefined };
      }
      const requestSignal = anyAbortSignal(signal, signalOpt);
      try {
        return await getMusicArtworkFn({ data: params, signal: requestSignal });
      } catch (error) {
        requestSignal.throwIfAborted();
        console.error("Failed to load music artwork; using Last.fm artwork or icons.", error);
        return {
          tracks: addLastfmArtworkFallback(params.tracks),
          artists: addLastfmArtworkFallback(params.artists),
          retryAfterMs: musicArtworkRetryDelay,
        };
      }
    },
    staleTime: (query) => query.state.data?.retryAfterMs ?? musicArtworkCacheDuration,
    refetchInterval: (query) => {
      const retryAfterMs = query.state.data?.retryAfterMs;
      if (retryAfterMs === undefined) return false;
      return Math.max(1000, retryAfterMs - (Date.now() - query.state.dataUpdatedAt));
    },
    refetchIntervalInBackground: false,
    gcTime: musicArtworkCacheDuration,
  });

const getRecentTracksParams = v.object({
  limit: v.optional(v.number()),
});

export const getRecentTracksFn = createServerFn({ method: "GET" })
  .validator(getRecentTracksParams)
  .handler(async ({ data }) => {
    const signal = getRequest().signal;
    const response = await fetchLastfm({
      method: "user.getRecentTracks",
      params: data,
      signal,
      schema: v.object({
        recenttracks: v.object({
          track: v.array(recentTrackSchema),
        }),
      }),
    });
    return response;
  });

export const getRecentTracks = (
  params: v.InferInput<typeof getRecentTracksParams>,
  signalOpt?: AbortSignal,
) =>
  queryOptions({
    queryKey: ["recent-tracks", params],
    queryFn: ({ signal }) =>
      getRecentTracksFn({ data: params, signal: anyAbortSignal(signal, signalOpt) }),
    select: (res) => res.recenttracks.track,
  });

export const fullPeriodLabels: Record<Period, string> = {
  "7day": "7 days",
  "1month": "30 days",
  "3month": "3 months",
  "6month": "6 months",
  "12month": "12 months",
  overall: "All time",
};

export const topTrackSchema = v.pipe(
  v.object({
    name: v.string(),
    image: v.optional(imageSchema),
    artist: v.pipe(
      v.object({ name: v.string() }),
      v.transform(({ name }) => name),
    ),
    playcount: vUtils.coerceNumber,
    "@attr": v.object({
      rank: vUtils.coerceNumber,
    }),
  }),
  v.transform(({ "@attr": { rank }, ...track }) => ({
    ...withLastfmArtwork(track),
    rank,
  })),
);

export type TopTrack = v.InferOutput<typeof topTrackSchema> & {
  lastfmArtworkUrl?: string;
  artwork?: Artwork;
  palette?: ArtworkPalette;
};

const getTopTracksParams = v.object({
  period: periodSchema,
  limit: v.optional(v.number()),
});

export const getTopTracksFn = createServerFn({ method: "GET" })
  .validator(getTopTracksParams)
  .handler(async ({ data }) => {
    const signal = getRequest().signal;
    const response = await fetchLastfm({
      method: "user.getTopTracks",
      params: data,
      signal,
      schema: v.object({
        toptracks: v.object({
          track: v.array(topTrackSchema),
        }),
      }),
    });
    return response;
  });

export const getTopTracks = (
  params: v.InferInput<typeof getTopTracksParams>,
  signalOpt?: AbortSignal,
) =>
  queryOptions({
    queryKey: ["top-tracks", params],
    queryFn: ({ signal }) =>
      getTopTracksFn({ data: params, signal: anyAbortSignal(signal, signalOpt) }),
    select: (res) => res.toptracks.track,
  });

const topArtistSchema = v.pipe(
  v.object({
    name: v.string(),
    playcount: vUtils.coerceNumber,
    image: v.optional(imageSchema),
    "@attr": v.object({
      rank: vUtils.coerceNumber,
    }),
  }),
  v.transform(({ "@attr": { rank }, ...artist }) => ({
    ...withLastfmArtwork(artist),
    rank,
  })),
);

export type TopArtist = v.InferOutput<typeof topArtistSchema> & {
  lastfmArtworkUrl?: string;
  artwork?: Artwork;
  palette?: ArtworkPalette;
};

const topArtistsResponseSchema = v.object({
  topartists: v.object({
    artist: v.array(topArtistSchema),
  }),
});

const getTopArtistsParams = v.object({
  period: periodSchema,
  limit: v.optional(v.number()),
});

export const getTopArtistsFn = createServerFn({ method: "GET" })
  .validator(getTopArtistsParams)
  .handler(async ({ data }) => {
    const signal = getRequest().signal;
    const response = await fetchLastfm({
      method: "user.getTopArtists",
      params: data,
      signal,
      schema: topArtistsResponseSchema,
    });
    return response;
  });

export const getTopArtists = (
  params: v.InferInput<typeof getTopArtistsParams>,
  signalOpt?: AbortSignal,
) =>
  queryOptions({
    queryKey: ["top-artists", params],
    queryFn: ({ signal }) =>
      getTopArtistsFn({ data: params, signal: anyAbortSignal(signal, signalOpt) }),
    select: (res) => res.topartists.artist,
  });

const userDataSchema = v.object({
  playcount: vUtils.coerceNumber,
  artist_count: vUtils.coerceNumber,
  track_count: vUtils.coerceNumber,
  album_count: vUtils.coerceNumber,
  registered: v.object({
    unixtime: vUtils.coerceNumber,
  }),
});

export type UserData = v.InferOutput<typeof userDataSchema>;

export const getUserDataFn = createServerFn({ method: "GET" }).handler(() =>
  fetchLastfm({
    method: "user.getInfo",
    signal: getRequest().signal,
    schema: v.object({
      user: userDataSchema,
    }),
  }),
);

export const getUserData = (signalOpt?: AbortSignal) =>
  queryOptions({
    queryKey: ["user"],
    queryFn: ({ signal }) => getUserDataFn({ signal: anyAbortSignal(signal, signalOpt) }),
    select: (res) => res.user,
  });
