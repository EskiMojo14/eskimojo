import { setTimeout } from "node:timers/promises";

import * as v from "valibot";

import { bestLastfmArtwork, fetchLastfm, imageSchema } from "./-lastfm";
import type { Artwork } from "./-query";

const errorSchema = v.object({ error: v.number(), message: v.string() });
const trackSchema = v.union([
  errorSchema,
  v.object({
    track: v.object({ album: v.optional(v.object({ image: v.optional(imageSchema) })) }),
  }),
]);
const albumsSchema = v.union([
  errorSchema,
  v.object({
    topalbums: v.object({ album: v.array(v.object({ image: v.optional(imageSchema) })) }),
  }),
]);

type ArtworkResult = { artwork?: Artwork; incomplete: boolean };
const cache = new Map<string, { artwork?: Artwork; expiresAt: number }>();
const cacheDuration = 6 * 60 * 60 * 1000;
const retryDelay = 30_000;
let rateLimitedUntil = 0;
let lastRequestAt = 0;
let requestQueue = Promise.resolve();

export function getLastfmArtworkRetryAfter() {
  const remaining = rateLimitedUntil - Date.now();
  return remaining > 0 ? remaining : undefined;
}

function pauseLookups(retryAfter: string | null = null) {
  const seconds = retryAfter === null ? NaN : Number(retryAfter);
  const duration = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(retryAfter ?? "") - Date.now();
  rateLimitedUntil = Math.max(
    rateLimitedUntil,
    Date.now() + Math.max(retryDelay, Number.isFinite(duration) ? duration : retryDelay),
  );
}

function handleResponse(response: Response) {
  if (response.status === 429) pauseLookups(response.headers.get("retry-after"));
}

function handleError(response: v.InferOutput<typeof errorSchema>) {
  if (response.error === 6 || response.error === 7) return;
  if (response.error === 29) pauseLookups();
  throw new Error(`Last.fm artwork lookup failed (${response.error}): ${response.message}`);
}

async function cachedArtwork(
  key: string,
  lookup: () => Promise<Artwork | undefined>,
  signal: AbortSignal,
): Promise<ArtworkResult> {
  signal.throwIfAborted();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now())
    return { artwork: cached.artwork, incomplete: false };
  const request = requestQueue.then(async (): Promise<ArtworkResult> => {
    signal.throwIfAborted();
    const existing = cache.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return { artwork: existing.artwork, incomplete: false };
    }
    if (getLastfmArtworkRetryAfter()) return { incomplete: true };
    const delay = Math.max(0, lastRequestAt + 250 - Date.now());
    if (delay > 0) await setTimeout(delay, undefined, { signal });
    signal.throwIfAborted();
    lastRequestAt = Date.now();
    const artwork = await lookup();
    cache.delete(key);
    cache.set(key, { artwork, expiresAt: Date.now() + cacheDuration });
    if (cache.size > 256) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    return { artwork, incomplete: false };
  });
  // A cancelled or failed lookup must not prevent later callers from using the queue.
  requestQueue = request.then(
    () => {},
    () => {},
  );
  return request;
}

async function addArtwork<T extends { artwork?: Artwork }>(
  items: Array<T>,
  key: (item: T) => string,
  lookup: (item: T, signal: AbortSignal) => Promise<Artwork | undefined>,
  signal: AbortSignal,
) {
  const lookupSignal = AbortSignal.any([signal, AbortSignal.timeout(10_000)]);
  const results: Array<T & { artwork?: Artwork }> = [...items];
  const pending = new Map<string, Promise<ArtworkResult>>();
  const errors: Array<unknown> = [];
  let incomplete = false;
  const queue = items.entries();
  await Promise.all(
    Array.from({ length: Math.min(3, items.length) }, async () => {
      for (const [index, item] of queue) {
        signal.throwIfAborted();
        if (item.artwork) continue;
        try {
          const cacheKey = key(item);
          let request = pending.get(cacheKey);
          if (!request) {
            request = cachedArtwork(cacheKey, () => lookup(item, lookupSignal), lookupSignal);
            pending.set(cacheKey, request);
          }
          const result = await request;
          if (result.incomplete) incomplete = true;
          if (result.artwork) results[index] = { ...item, artwork: result.artwork };
        } catch (error) {
          signal.throwIfAborted();
          incomplete = true;
          errors.push(error);
        }
      }
    }),
  );
  if (errors.length > 0) {
    console.warn(
      "Last.fm artwork lookup failed; listening data is still available.",
      new AggregateError(errors),
    );
  }
  return { items: results, incomplete };
}

export function addLastfmTrackArtwork<
  T extends { name: string; artist: string; artwork?: Artwork },
>(items: Array<T>, signal: AbortSignal) {
  return addArtwork(
    items,
    (item) => JSON.stringify(["track", item.artist, item.name]),
    async (item, requestSignal) => {
      const response = await fetchLastfm({
        method: "track.getInfo",
        params: { artist: item.artist, track: item.name, autocorrect: 0 },
        schema: trackSchema,
        signal: requestSignal,
        onResponse: handleResponse,
      });
      if ("error" in response) {
        handleError(response);
        return undefined;
      }
      const imageUrl = bestLastfmArtwork(response.track.album?.image);
      return imageUrl ? { imageUrl } : undefined;
    },
    signal,
  );
}

export function addLastfmArtistArtwork<T extends { name: string; artwork?: Artwork }>(
  items: Array<T>,
  signal: AbortSignal,
) {
  return addArtwork(
    items,
    (item) => JSON.stringify(["artist", item.name]),
    async (item, requestSignal) => {
      const response = await fetchLastfm({
        method: "artist.getTopAlbums",
        params: { artist: item.name, limit: 1, autocorrect: 0 },
        schema: albumsSchema,
        signal: requestSignal,
        onResponse: handleResponse,
      });
      if ("error" in response) {
        handleError(response);
        return undefined;
      }
      const imageUrl = bestLastfmArtwork(response.topalbums.album[0]?.image);
      return imageUrl ? { imageUrl } : undefined;
    },
    signal,
  );
}
