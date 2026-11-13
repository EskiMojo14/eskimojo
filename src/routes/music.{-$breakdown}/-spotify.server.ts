import * as v from "valibot";

import { getServerEnv } from "#/utils/env.ts";

import type { SpotifyArtwork, TopArtist, TopTrack, RecentTrack } from "./-query";

const spotifyTokenSchema = v.object({
  access_token: v.string(),
  expires_in: v.number(),
});

const imageSchema = v.object({
  url: v.string(),
});

const artistResultSchema = v.object({
  name: v.string(),
  images: v.optional(v.array(imageSchema)),
  external_urls: v.optional(
    v.object({
      spotify: v.optional(v.string()),
    }),
  ),
});

const trackResultSchema = v.object({
  name: v.string(),
  artists: v.array(v.object({ name: v.string() })),
  album: v.object({
    images: v.optional(v.array(imageSchema)),
  }),
  external_urls: v.optional(
    v.object({
      spotify: v.optional(v.string()),
    }),
  ),
});

const artistSearchSchema = v.object({
  artists: v.object({
    items: v.array(artistResultSchema),
  }),
});

const trackSearchSchema = v.object({
  tracks: v.object({
    items: v.array(trackResultSchema),
  }),
});

type SearchCacheEntry = {
  artwork: SpotifyArtwork | undefined;
  expiresAt: number;
};

const market = "GB";
const cacheDuration = 6 * 60 * 60 * 1000;
const maxCacheEntries = 256;
const artworkCache = new Map<string, SearchCacheEntry>();
let tokenCache: { value: string; expiresAt: number } | undefined;
let tokenRequest: Promise<string> | undefined;

function normalizedName(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-GB")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function spotifyUrl(value: string | undefined, hostname: string) {
  if (!value || !URL.canParse(value)) return undefined;
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === hostname ? url.href : undefined;
}

function imageUrl(images: Array<v.InferOutput<typeof imageSchema>> | undefined) {
  if (!images) return undefined;
  for (let index = images.length - 1; index >= 0; index--) {
    const url = spotifyUrl(images[index]?.url, "i.scdn.co");
    if (url) return url;
  }
  return undefined;
}

async function responseJson<T extends v.GenericSchema>(
  response: Response,
  schema: T,
  description: string,
) {
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`${description} failed (${response.status})`);
  }
  return v.parse(schema, await response.json());
}

async function requestAccessToken() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = getServerEnv();
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify artwork requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.");
  }
  const authorization = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
    "utf8",
  ).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    signal: AbortSignal.timeout(10_000),
  });
  const token = await responseJson(response, spotifyTokenSchema, "Spotify token request");
  tokenCache = {
    value: token.access_token,
    expiresAt: Date.now() + Math.max(0, token.expires_in - 60) * 1000,
  };
  return tokenCache.value;
}

async function accessToken(signal: AbortSignal) {
  signal.throwIfAborted();
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.value;
  tokenRequest ??= requestAccessToken().finally(() => {
    tokenRequest = undefined;
  });
  const token = await tokenRequest;
  signal.throwIfAborted();
  return token;
}

async function spotifySearch<T extends v.GenericSchema>(
  query: string,
  type: "artist" | "track",
  schema: T,
  signal: AbortSignal,
) {
  const token = await accessToken(signal);
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", type);
  url.searchParams.set("market", market);
  url.searchParams.set("limit", "10");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  return responseJson(response, schema, "Spotify catalog search");
}

function cacheKey(kind: "artist" | "track", name: string, artist?: string) {
  return [kind, market, normalizedName(name), artist ? normalizedName(artist) : ""].join(":");
}

async function cachedArtwork(
  key: string,
  lookup: () => Promise<SpotifyArtwork | undefined>,
): Promise<SpotifyArtwork | undefined> {
  const cached = artworkCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.artwork;

  const artwork = await lookup();
  artworkCache.delete(key);
  artworkCache.set(key, { artwork, expiresAt: Date.now() + cacheDuration });
  if (artworkCache.size > maxCacheEntries) {
    const oldest = artworkCache.keys().next().value;
    if (oldest !== undefined) artworkCache.delete(oldest);
  }
  return artwork;
}

async function findTrackArtwork(name: string, artist: string, signal: AbortSignal) {
  const key = cacheKey("track", name, artist);
  return cachedArtwork(key, async () => {
    const response = await spotifySearch(`${name} ${artist}`, "track", trackSearchSchema, signal);
    const expectedName = normalizedName(name);
    const expectedArtist = normalizedName(artist);
    const match = response.tracks.items.find(
      (track) =>
        normalizedName(track.name) === expectedName &&
        track.artists.some(
          ({ name: trackArtist }) => normalizedName(trackArtist) === expectedArtist,
        ),
    );
    const image = imageUrl(match?.album.images);
    const href = spotifyUrl(match?.external_urls?.spotify, "open.spotify.com");
    return image && href ? { imageUrl: image, spotifyUrl: href } : undefined;
  });
}

async function findArtistArtwork(name: string, signal: AbortSignal) {
  const key = cacheKey("artist", name);
  return cachedArtwork(key, async () => {
    const response = await spotifySearch(`artist:${name}`, "artist", artistSearchSchema, signal);
    const expectedName = normalizedName(name);
    const match = response.artists.items.find(
      (artist) => normalizedName(artist.name) === expectedName,
    );
    const image = imageUrl(match?.images);
    const href = spotifyUrl(match?.external_urls?.spotify, "open.spotify.com");
    return image && href ? { imageUrl: image, spotifyUrl: href } : undefined;
  });
}

async function addArtwork<T extends { artwork?: SpotifyArtwork }>(
  items: Array<T>,
  lookup: (item: T, signal: AbortSignal) => Promise<SpotifyArtwork | undefined>,
  signal: AbortSignal,
): Promise<Array<T & { artwork?: SpotifyArtwork }>> {
  const artwork: Array<SpotifyArtwork | undefined> = Array.from(
    { length: items.length },
    () => undefined,
  );
  const errors: Array<unknown> = [];
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(3, items.length) }, async () => {
      while (nextIndex < items.length) {
        signal.throwIfAborted();
        const index = nextIndex++;
        const item = items[index];
        if (!item) continue;
        try {
          artwork[index] = await lookup(item, signal);
        } catch (error) {
          signal.throwIfAborted();
          errors.push(error);
        }
      }
    }),
  );

  if (errors.length > 0) {
    console.error(
      "Spotify artwork lookup failed; Last.fm listening data is still available.",
      new AggregateError(errors),
    );
  }
  return items.map((item, index) => {
    const itemArtwork = artwork[index];
    return itemArtwork ? { ...item, artwork: itemArtwork } : item;
  });
}

export function addSpotifyTrackArtwork<
  T extends Pick<RecentTrack | TopTrack, "name" | "artist"> & { artwork?: SpotifyArtwork },
>(items: Array<T>, signal: AbortSignal): Promise<Array<T & { artwork?: SpotifyArtwork }>> {
  return addArtwork(
    items,
    (item, requestSignal) => findTrackArtwork(item.name, item.artist, requestSignal),
    signal,
  );
}

export function addSpotifyArtistArtwork<
  T extends Pick<TopArtist, "name"> & { artwork?: SpotifyArtwork },
>(items: Array<T>, signal: AbortSignal): Promise<Array<T & { artwork?: SpotifyArtwork }>> {
  return addArtwork(
    items,
    (item, requestSignal) => findArtistArtwork(item.name, requestSignal),
    signal,
  );
}
