import { queryOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import * as v from "valibot";

import { getServerEnv } from "#/utils/env.ts";
import { anyAbortSignal, upfetch } from "#/utils/index.ts";
import * as vUtils from "#/utils/valibot";

import { addArtworkPalettes } from "./-artwork-palette.server";
import { periodSchema, type Period } from "./-constants";
import {
  addSpotifyArtistArtwork,
  addSpotifyTrackArtwork,
  getSpotifyRateLimitRetryAfter,
} from "./-spotify.server";

export { periodSchema, type Period } from "./-constants";

const artworkSchema = v.object({
  imageUrl: v.string(),
  spotifyUrl: v.optional(v.string()),
});
export type Artwork = v.InferOutput<typeof artworkSchema>;
export type SpotifyArtwork = Artwork & { spotifyUrl: string };

export type ArtworkPalette = Record<`--artwork-${string}`, string>;

export const fetchLastfm = createServerOnlyFn(
  <T extends v.GenericSchema>({
    method,
    params,
    schema,
    signal,
  }: {
    method: string;
    params?: Record<string, unknown>;
    schema: T;
    signal?: AbortSignal;
  }) => {
    const { LASTFM_API_KEY, LASTFM_USER } = getServerEnv();
    return upfetch("https://ws.audioscrobbler.com/2.0/", {
      params: {
        api_key: LASTFM_API_KEY,
        format: "json",
        user: LASTFM_USER,
        ...params,
        method,
      },
      signal,
      schema,
    });
  },
);

const itemSchema = v.pipe(
  v.object({
    "#text": v.string(),
  }),
  v.transform((item) => item["#text"]),
);

const imageSizeSchema = v.picklist(["small", "medium", "large", "extralarge", "mega"]);
type ImageSize = v.InferOutput<typeof imageSizeSchema>;

const lastfmArtworkHosts = new Set(["lastfm-img.freetls.fastly.net", "lastfm.freetls.fastly.net"]);
const lastfmPlaceholderFilename = "2a96cbd8b46e442fc41c2b86b821562f.png";

function normalizeLastfmArtworkUrl(src: string | undefined) {
  if (!src || src.length > 2048 || !URL.canParse(src)) return undefined;
  const url = new URL(src);
  if (
    url.protocol !== "https:" ||
    !lastfmArtworkHosts.has(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    url.pathname.endsWith(`/${lastfmPlaceholderFilename}`)
  ) {
    return undefined;
  }
  if (url.hostname === "lastfm-img.freetls.fastly.net") {
    // The legacy hostname can serve stale cached 404s for otherwise available artwork.
    url.hostname = "lastfm.freetls.fastly.net";
  }
  return url.href;
}

export const imageSchema = v.pipe(
  v.array(
    v.object({
      size: imageSizeSchema,
      "#text": v.string(),
    }),
  ),
  v.transform((images) =>
    images.reduce<Partial<Record<ImageSize, string>>>((acc, image) => {
      const src = normalizeLastfmArtworkUrl(image["#text"]);
      if (src) acc[image.size] = src;
      return acc;
    }, {}),
  ),
);

export function bestLastfmArtwork(image: Partial<Record<ImageSize, string>> | undefined) {
  return image?.mega ?? image?.extralarge ?? image?.large ?? image?.medium ?? image?.small;
}

function withLastfmArtwork<T extends { image?: Partial<Record<ImageSize, string>> }>(
  item: T,
): Omit<T, "image"> & { lastfmArtworkUrl?: string } {
  const { image, ...rest } = item;
  const lastfmArtworkUrl = bestLastfmArtwork(image);
  return lastfmArtworkUrl ? { ...rest, lastfmArtworkUrl } : rest;
}

export function addLastfmArtworkFallback<
  T extends { artwork?: SpotifyArtwork; lastfmArtworkUrl?: string },
>(items: Array<T>): Array<Omit<T, "artwork" | "lastfmArtworkUrl"> & { artwork?: Artwork }> {
  return items.map(({ artwork, lastfmArtworkUrl, ...item }) => {
    if (artwork) return { ...item, artwork };
    const imageUrl = normalizeLastfmArtworkUrl(lastfmArtworkUrl);
    return imageUrl ? { ...item, artwork: { imageUrl } } : item;
  });
}

const commonRecentTrackSchema = v.object({
  name: v.string(),
  image: v.optional(imageSchema),
  artist: itemSchema,
  album: itemSchema,
});

const recentTrackSchema = v.union([
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

const spotifyArtworkParams = v.object({
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

const spotifyArtworkCacheDuration = 6 * 60 * 60 * 1000;

export const getSpotifyArtworkFn = createServerFn({ method: "POST" })
  .validator(spotifyArtworkParams)
  .handler(async ({ data }) => {
    const signal = getRequest().signal;
    const [tracksWithSpotifyArtwork, artistsWithSpotifyArtwork] = await Promise.all([
      addSpotifyTrackArtwork(data.tracks, signal),
      addSpotifyArtistArtwork(data.artists, signal),
    ]);
    const tracksWithArtwork = addLastfmArtworkFallback(tracksWithSpotifyArtwork);
    const artistsWithArtwork = addLastfmArtworkFallback(artistsWithSpotifyArtwork);
    const [tracks, artists] = await Promise.all([
      addArtworkPalettes(tracksWithArtwork, signal),
      addArtworkPalettes(artistsWithArtwork, signal),
    ]);
    return {
      tracks,
      artists,
      retryAfterMs: getSpotifyRateLimitRetryAfter(),
    };
  });

export const getSpotifyArtwork = (
  params: v.InferInput<typeof spotifyArtworkParams>,
  signalOpt?: AbortSignal,
) =>
  queryOptions({
    queryKey: ["spotify-artwork", params],
    queryFn: ({ signal }) =>
      params.tracks.length === 0 && params.artists.length === 0
        ? Promise.resolve({ tracks: [], artists: [], retryAfterMs: undefined })
        : getSpotifyArtworkFn({ data: params, signal: anyAbortSignal(signal, signalOpt) }),
    initialData: {
      tracks: params.tracks.map(({ name, artist, lastfmArtworkUrl }) => ({
        name,
        artist,
        artwork: lastfmArtworkUrl ? { imageUrl: lastfmArtworkUrl } : undefined,
      })),
      artists: params.artists.map(({ name, lastfmArtworkUrl }) => ({
        name,
        artwork: lastfmArtworkUrl ? { imageUrl: lastfmArtworkUrl } : undefined,
      })),
      retryAfterMs: undefined,
    },
    initialDataUpdatedAt: 0,
    staleTime: (query) => {
      const retryAfterMs = query.state.data?.retryAfterMs;
      return retryAfterMs === undefined
        ? spotifyArtworkCacheDuration
        : Math.max(0, retryAfterMs - (Date.now() - query.state.dataUpdatedAt));
    },
    refetchInterval: (query) => {
      const retryAfterMs = query.state.data?.retryAfterMs;
      if (retryAfterMs === undefined) return false;
      return Math.max(1000, retryAfterMs - (Date.now() - query.state.dataUpdatedAt));
    },
    refetchIntervalInBackground: false,
    gcTime: spotifyArtworkCacheDuration,
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

const topTrackSchema = v.pipe(
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
