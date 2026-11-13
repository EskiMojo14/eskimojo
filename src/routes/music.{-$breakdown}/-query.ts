import { queryOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import * as v from "valibot";

import { getServerEnv } from "#/utils/env.ts";
import { anyAbortSignal, upfetch } from "#/utils/index.ts";
import * as vUtils from "#/utils/valibot";

import { periodSchema, type Period } from "./-constants";

export { periodSchema, type Period } from "./-constants";

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

const imageSizeSchema = v.picklist(["small", "medium", "large", "extralarge", "mega"]);
type ImageSize = v.InferOutput<typeof imageSizeSchema>;

const itemSchema = v.pipe(
  v.object({
    "#text": v.string(),
  }),
  v.transform((item) => item["#text"]),
);

const imageSchema = v.pipe(
  v.array(
    v.object({
      size: imageSizeSchema,
      "#text": v.string(),
    }),
  ),
  v.transform((images) =>
    images.reduce<Partial<Record<ImageSize, string>>>((acc, image) => {
      acc[image.size] = image["#text"];
      return acc;
    }, {}),
  ),
);

const baseTrackSchema = v.object({
  name: v.string(),
  image: imageSchema,
});

const commonRecentTrackSchema = v.object({
  ...baseTrackSchema.entries,
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
      ...track,
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
    v.transform(({ "@attr": _attr, ...rest }) => ({
      ...rest,
      nowPlaying: true as const,
    })),
  ),
]);

export type RecentTrack = v.InferOutput<typeof recentTrackSchema> & {
  palette?: Record<`--artwork-${string}`, string>;
};

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
    const { addArtworkPalettes } = await import("./-artwork-palette.server");
    return {
      ...response,
      recenttracks: {
        ...response.recenttracks,
        track: await addArtworkPalettes(response.recenttracks.track, signal),
      },
    };
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
    ...baseTrackSchema.entries,
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
    ...track,
    rank,
  })),
);

export type TopTrack = v.InferOutput<typeof topTrackSchema>;

const getTopTracksParams = v.object({
  period: periodSchema,
  limit: v.optional(v.number()),
});

export const getTopTracksFn = createServerFn({ method: "GET" })
  .validator(getTopTracksParams)
  .handler(({ data }) =>
    fetchLastfm({
      method: "user.getTopTracks",
      params: data,
      signal: getRequest().signal,
      schema: v.object({
        toptracks: v.object({
          track: v.array(topTrackSchema),
        }),
      }),
    }),
  );

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
    image: imageSchema,
    "@attr": v.object({
      rank: vUtils.coerceNumber,
    }),
  }),
  v.transform(({ "@attr": { rank }, ...artist }) => ({
    ...artist,
    rank,
  })),
);

export type TopArtist = v.InferOutput<typeof topArtistSchema>;

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
  .handler(({ data }) =>
    fetchLastfm({
      method: "user.getTopArtists",
      params: data,
      signal: getRequest().signal,
      schema: topArtistsResponseSchema,
    }),
  );

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
