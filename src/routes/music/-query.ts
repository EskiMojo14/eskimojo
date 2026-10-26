import type { QueryKey, UnusedSkipTokenOptions, WithRequired } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { up } from "up-fetch";
import * as v from "valibot";

import { withServerEnv } from "#/utils/env.ts";
import { unsafeEntries } from "#/utils/index.ts";
import type { HasRequiredProps } from "#/utils/types";
import * as vUtils from "#/utils/valibot";

export const periodSchema = v.picklist([
  "7day",
  "1month",
  "3month",
  "6month",
  "12month",
  "overall",
]);
export type Period = v.InferOutput<typeof periodSchema>;

const lastfmMethodParams = {
  "user.getRecentTracks": v.object({
    limit: v.optional(v.number()),
  }),
  "user.getTopTracks": v.object({
    period: periodSchema,
    limit: v.optional(v.number()),
  }),
  "user.getTopArtists": v.object({
    period: periodSchema,
    limit: v.optional(v.number()),
  }),
  "user.getInfo": v.object({}),
};

type LastfmMethod = keyof typeof lastfmMethodParams;

const lastfmRequestSchema = v.variant(
  "method",
  unsafeEntries(lastfmMethodParams).map(([method, schema]) =>
    v.object({
      method: v.literal(method),
      params: schema,
    }),
  ),
);

const upfetch = up(fetch);

const fetchLastfm = createServerFn({ method: "GET" })
  .middleware([withServerEnv])
  .validator(lastfmRequestSchema)
  .handler(({ data, context: { serverEnv } }) =>
    upfetch("https://ws.audioscrobbler.com/2.0/", {
      params: {
        api_key: serverEnv.LASTFM_API_KEY,
        format: "json",
        user: serverEnv.LASTFM_USER,
        ...data.params,
        method: data.method,
      },
    }),
  );

type ParamsSchema = v.ObjectSchema<
  Record<string, v.GenericSchema<unknown, string | number | boolean | undefined>>,
  v.ErrorMessage<v.ObjectIssue> | undefined
>;

type ParamsArgs<TParamsSchema extends ParamsSchema> = HasRequiredProps<
  v.InferInput<TParamsSchema>,
  [params: v.InferInput<TParamsSchema>],
  [params?: v.InferInput<TParamsSchema>]
>;

interface EndpointOptions<
  TMethod extends LastfmMethod,
  TResponseSchema extends v.GenericSchema,
  TQueryKey extends QueryKey,
  Selected,
  TMultiParams extends keyof v.InferInput<(typeof lastfmMethodParams)[TMethod]>,
> {
  method: TMethod;
  responseSchema: TResponseSchema;
  getQueryKey: (params: v.InferInput<(typeof lastfmMethodParams)[TMethod]>) => TQueryKey;
  select: (output: v.InferOutput<TResponseSchema>) => Selected;
  multiParams?: Array<TMultiParams>;
}

interface Endpoint<
  TMethod extends LastfmMethod,
  TResponseSchema extends v.GenericSchema,
  TQueryKey extends QueryKey,
  Selected,
  TMultiParams extends keyof v.InferInput<(typeof lastfmMethodParams)[TMethod]>,
> {
  (
    ...args: ParamsArgs<(typeof lastfmMethodParams)[TMethod]>
  ): WithRequired<
    UnusedSkipTokenOptions<Selected, Error, Selected, readonly ["lastfm", ...TQueryKey]>,
    "queryKey"
  >;
  method: TMethod;
  paramsSchema: (typeof lastfmMethodParams)[TMethod];
  multiParams: Array<TMultiParams>;
  responseSchema: TResponseSchema;
}

const buildEndpoint = <
  const TMethod extends LastfmMethod,
  TResponseSchema extends v.GenericSchema,
  const TQueryKey extends QueryKey,
  Selected = v.InferOutput<TResponseSchema>,
  TMultiParams extends keyof v.InferInput<(typeof lastfmMethodParams)[TMethod]> = never,
>({
  method,
  responseSchema,
  getQueryKey,
  multiParams = [] as Array<TMultiParams>,
  select,
}: EndpointOptions<TMethod, TResponseSchema, TQueryKey, Selected, TMultiParams>): Endpoint<
  TMethod,
  TResponseSchema,
  TQueryKey,
  Selected,
  TMultiParams
> => {
  const paramsSchema = lastfmMethodParams[method];
  return Object.assign(
    function endpointOptions(params: Record<string, unknown> = {}) {
      const parsed = v.parse(paramsSchema, params);
      return queryOptions({
        queryKey: ["lastfm", ...getQueryKey(parsed)] as const,
        queryFn: ({ signal }) =>
          fetchLastfm({
            data: {
              method,
              params: parsed,
            },
            signal,
          }).then((response) => select(v.parse(responseSchema, response))),
      });
    },
    {
      method,
      paramsSchema,
      multiParams,
      responseSchema,
    },
  );
};

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

export type RecentTrack = v.InferOutput<typeof recentTrackSchema>;

export const getRecentTracks = buildEndpoint({
  method: "user.getRecentTracks",
  responseSchema: v.object({
    recenttracks: v.object({
      track: v.array(recentTrackSchema),
    }),
  }),
  getQueryKey: ({ limit }) => ["recent-tracks", { limit }],
  select: (res) => res.recenttracks.track,
});

export const periodLabels: Record<Period, string> = {
  "7day": "7d",
  "1month": "30d",
  "3month": "3m",
  "6month": "6m",
  "12month": "12m",
  overall: "All",
};

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

export const getTopTracks = buildEndpoint({
  method: "user.getTopTracks",
  responseSchema: v.object({
    toptracks: v.object({
      track: v.array(topTrackSchema),
    }),
  }),
  getQueryKey: ({ period, limit }) => ["top-tracks", { period, limit }],
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

export const getTopArtists = buildEndpoint({
  method: "user.getTopArtists",
  responseSchema: topArtistsResponseSchema,
  getQueryKey: ({ period, limit }) => ["top-artists", { period, limit }],
  select: (res) => res.topartists.artist,
});

const userDataSchema = v.object({
  playcount: vUtils.coerceNumber,
  artist_count: vUtils.coerceNumber,
  track_count: vUtils.coerceNumber,
  album_count: vUtils.coerceNumber,
});

export type UserData = v.InferOutput<typeof userDataSchema>;

export const getUserData = buildEndpoint({
  method: "user.getInfo",
  responseSchema: v.object({
    user: userDataSchema,
  }),
  getQueryKey: () => ["user"],
  select: (res) => res.user,
});
