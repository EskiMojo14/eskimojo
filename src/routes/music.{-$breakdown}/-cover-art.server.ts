import { setTimeout } from "node:timers/promises";

import * as v from "valibot";

import { mbidSchema } from "./-constants";
import type { Artwork } from "./-query";
import { addSpotifyTrackArtwork } from "./-spotify.server";

const releasesSchema = v.object({
  releases: v.optional(v.array(v.object({ id: mbidSchema })), []),
});
const cacheDuration = 6 * 60 * 60 * 1000;
const cache = new Map<string, { artwork: Artwork | undefined; expiresAt: number }>();
const releaseCache = new Map<string, { ids: Array<string>; expiresAt: number }>();
const userAgent = "eskimojo/1.0 (https://github.com/EskiMojo14/eskimojo)";
let musicbrainzQueue = Promise.resolve();
let nextMusicbrainzRequestAt = 0;
let musicbrainzUnavailableUntil = 0;

export function getMusicbrainzRetryAfter() {
  const remaining = musicbrainzUnavailableUntil - Date.now();
  return remaining > 0 ? remaining : undefined;
}

function pauseMusicbrainz(retryAfter: string | null) {
  const seconds = retryAfter === null ? NaN : Number(retryAfter);
  const requestedDelay =
    Number.isFinite(seconds) && seconds >= 0
      ? seconds * 1000
      : Date.parse(retryAfter ?? "") - Date.now();
  musicbrainzUnavailableUntil = Math.max(
    musicbrainzUnavailableUntil,
    Date.now() + Math.max(30_000, Number.isFinite(requestedDelay) ? requestedDelay : 0),
  );
}

export function isCoverArtHost(hostname: string) {
  return (
    hostname === "coverartarchive.org" ||
    hostname === "archive.org" ||
    /^(?:ia|dn)\d+\.(?:us|eu|ca)\.archive\.org$/.test(hostname)
  );
}

function cacheResult<T>(target: Map<string, T>, key: string, value: T) {
  target.delete(key);
  target.set(key, value);
  if (target.size > 256) {
    const oldest = target.keys().next().value;
    if (oldest !== undefined) target.delete(oldest);
  }
}

async function recordingReleases(mbid: string, signal: AbortSignal) {
  const cached = releaseCache.get(mbid);
  if (cached && cached.expiresAt > Date.now()) return { ids: cached.ids, incomplete: false };

  const request = musicbrainzQueue.then(async () => {
    signal.throwIfAborted();
    const existing = releaseCache.get(mbid);
    if (existing && existing.expiresAt > Date.now())
      return { ids: existing.ids, incomplete: false };
    let currentMbid = mbid;
    let url = new URL(
      `https://musicbrainz.org/ws/2/recording/${currentMbid}?inc=releases&fmt=json`,
    );
    for (let redirects = 0; redirects <= 5; redirects++) {
      if (getMusicbrainzRetryAfter() !== undefined) {
        return { ids: [], incomplete: true };
      }
      await setTimeout(Math.max(0, nextMusicbrainzRequestAt - Date.now()), undefined, { signal });
      signal.throwIfAborted();
      const response = await fetch(url, {
        signal,
        redirect: "manual",
        headers: { "User-Agent": userAgent },
      });
      nextMusicbrainzRequestAt = Date.now() + 1000;
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) throw new Error("MusicBrainz recording redirect has no destination");
        const destination = new URL(location, url);
        const canonicalMbid = destination.pathname.match(/^\/ws\/2\/recording\/([^/]+)$/)?.[1];
        if (
          destination.origin !== "https://musicbrainz.org" ||
          destination.username ||
          destination.password ||
          !v.is(mbidSchema, canonicalMbid)
        ) {
          throw new Error("MusicBrainz redirected to an unsupported recording URL");
        }
        currentMbid = canonicalMbid;
        url = new URL(
          `https://musicbrainz.org/ws/2/recording/${canonicalMbid}?inc=releases&fmt=json`,
        );
        continue;
      }
      if (response.status === 503 || response.status === 429) {
        pauseMusicbrainz(response.headers.get("retry-after"));
      }
      if (!response.ok && response.status !== 404) {
        await response.body?.cancel();
        throw new Error(`MusicBrainz recording lookup failed (${response.status})`);
      }
      const ids =
        response.status === 404
          ? []
          : v.parse(releasesSchema, await response.json()).releases.map(({ id }) => id);
      if (response.status === 404) await response.body?.cancel();
      const value = { ids, expiresAt: Date.now() + cacheDuration };
      cacheResult(releaseCache, mbid, value);
      cacheResult(releaseCache, currentMbid, value);
      return { ids, incomplete: false };
    }
    throw new Error("MusicBrainz exceeded its recording redirect limit");
  });
  // A failed lookup must not poison the shared, one-request-per-second queue.
  musicbrainzQueue = request.then(
    () => {},
    () => {},
  );
  return request;
}

async function releaseArtwork(
  mbid: string,
  kind: "release" | "release-group",
  signal: AbortSignal,
): Promise<Artwork | undefined> {
  const key = `${kind}:${mbid}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.artwork;
  let url = new URL(`https://coverartarchive.org/${kind}/${mbid}/front-250`);
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (
      url.protocol !== "https:" ||
      !isCoverArtHost(url.hostname) ||
      url.port ||
      url.username ||
      url.password
    ) {
      throw new Error("Cover Art Archive redirected to an unsupported artwork URL");
    }
    const response = await fetch(url, {
      method: "HEAD",
      signal,
      redirect: "manual",
      headers: { "User-Agent": userAgent },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("Cover Art Archive redirect has no destination");
      url = new URL(location, url);
      continue;
    }
    await response.body?.cancel();
    if (response.status === 404) {
      cacheResult(cache, key, { artwork: undefined, expiresAt: Date.now() + cacheDuration });
      return undefined;
    }
    if (!response.ok) throw new Error(`Cover Art Archive lookup failed (${response.status})`);
    if (!response.headers.get("content-type")?.startsWith("image/")) {
      throw new Error("Cover Art Archive response is not an image");
    }
    const artwork = { imageUrl: url.href };
    cacheResult(cache, key, { artwork, expiresAt: Date.now() + cacheDuration });
    return artwork;
  }
  throw new Error("Cover Art Archive exceeded its redirect limit");
}

export async function addCoverArtArtwork<
  T extends { recordingMbid?: string; releaseMbid?: string; artwork?: Artwork },
>(items: Array<T>, signal: AbortSignal) {
  const lookupSignal = AbortSignal.any([signal, AbortSignal.timeout(12_000)]);
  const results: Array<T & { artwork?: Artwork }> = [...items];
  const errors: Array<unknown> = [];
  let incomplete = false;
  const pending = new Map<string, Promise<Artwork | undefined>>();
  const lookupRelease = (id: string, kind: "release" | "release-group" = "release") => {
    const key = `${kind}:${id}`;
    let request = pending.get(key);
    if (!request) {
      request = releaseArtwork(id, kind, lookupSignal);
      pending.set(key, request);
    }
    return request;
  };
  const queue = items.entries();
  await Promise.all(
    Array.from({ length: Math.min(3, items.length) }, async () => {
      for (const [index, item] of queue) {
        signal.throwIfAborted();
        if (!item.releaseMbid && !item.recordingMbid) continue;
        try {
          let artwork = item.releaseMbid ? await lookupRelease(item.releaseMbid) : undefined;
          if (!artwork && item.releaseMbid) {
            artwork = await lookupRelease(item.releaseMbid, "release-group");
          }
          if (!artwork && item.recordingMbid) {
            const releases = await recordingReleases(item.recordingMbid, lookupSignal);
            if (releases.incomplete) incomplete = true;
            for (const id of releases.ids.slice(0, 3)) {
              artwork = await lookupRelease(id);
              if (artwork) break;
            }
          }
          if (artwork) results[index] = { ...item, artwork };
        } catch (error) {
          signal.throwIfAborted();
          errors.push(error);
        }
      }
    }),
  );
  if (errors.length > 0) {
    console.warn(
      "Cover Art Archive lookup failed; trying Spotify artwork.",
      new AggregateError(errors),
    );
  }
  return { items: results, incomplete: incomplete || errors.length > 0 };
}

export async function addTrackArtwork<
  T extends { name: string; artist: string; recordingMbid?: string; releaseMbid?: string },
>(items: Array<T>, signal: AbortSignal) {
  const coverArt = await addCoverArtArtwork(items, signal);
  const missingArtwork = coverArt.items.flatMap((item, index) =>
    item.artwork ? [] : [{ ...item, index, artwork: undefined }],
  );
  const spotify = await addSpotifyTrackArtwork(missingArtwork, signal);
  const enriched = [...coverArt.items];
  for (const { index, ...track } of spotify.items) {
    const original = enriched[index];
    if (original) enriched[index] = { ...original, artwork: track.artwork };
  }
  return { items: enriched, incomplete: coverArt.incomplete || spotify.incomplete };
}
