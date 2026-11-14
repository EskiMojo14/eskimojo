import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import sharp from "sharp";
import * as v from "valibot";
import { network } from "virtual:msw";
import { beforeEach, expect, onTestFinished, test, vi } from "vite-plus/test";

import { addLastfmArtworkFallback, bestLastfmArtwork, imageSchema } from "./-lastfm";
import type * as MusicQuery from "./-query";

let query: typeof MusicQuery;

beforeEach(async () => {
  vi.resetModules();
  query = await import("./-query");
});

test("uses existing Last.fm artwork and palettes without additional metadata lookups", async () => {
  const image = await sharp({
    create: { width: 8, height: 8, channels: 4, background: "#2040ca" },
  })
    .png()
    .toBuffer();
  const lastfmArtworkUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/first-choice.png";
  let requests = 0;
  network.use(
    http.get(
      lastfmArtworkUrl,
      () =>
        new HttpResponse(new Uint8Array(image), {
          headers: { "Content-Type": "image/png" },
        }),
    ),
    http.get("https://ws.audioscrobbler.com/2.0/", () => {
      requests++;
      return new HttpResponse(null, { status: 503 });
    }),
  );
  const result = await query.resolveMusicArtwork(
    {
      tracks: [{ name: "Covered Song", artist: "Example Artist", lastfmArtworkUrl }],
      albums: [{ name: "Covered Album", artist: "Example Artist", lastfmArtworkUrl }],
      artists: [{ name: "Covered Artist", lastfmArtworkUrl }],
    },
    new AbortController().signal,
  );
  expect(result.tracks[0]?.artwork).toEqual({ imageUrl: lastfmArtworkUrl });
  expect(result.artists[0]?.artwork).toEqual({ imageUrl: lastfmArtworkUrl });
  expect(result.tracks[0]?.palette).toBeDefined();
  expect(result.artists[0]?.palette).toBeDefined();
  expect(result.albums[0]?.artwork).toEqual({ imageUrl: lastfmArtworkUrl });
  expect(result.albums[0]?.palette).toBeDefined();
  expect(result.retryAfterMs).toBeUndefined();
  expect(requests).toBe(0);
});

test("resolves only missing covers from Last.fm, preserves order, and caches the lookups", async () => {
  vi.stubEnv("LASTFM_API_KEY", "lastfm-test-key");
  vi.stubEnv("LASTFM_USER", "test-user");
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  const image = await sharp({
    create: { width: 8, height: 8, channels: 4, background: "#ca2020" },
  })
    .png()
    .toBuffer();
  const existingUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/existing.png";
  const trackUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/track-cover.png";
  const artistUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/artist-album.png";
  const albumUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/album-cover.png";
  const lookups: Array<Array<string | null>> = [];
  network.use(
    http.get(
      "https://lastfm.freetls.fastly.net/i/u/300x300/*",
      () => new HttpResponse(new Uint8Array(image), { headers: { "Content-Type": "image/png" } }),
    ),
    http.get("https://ws.audioscrobbler.com/2.0/", ({ request }) => {
      const params = new URL(request.url).searchParams;
      const method = params.get("method");
      lookups.push([
        method,
        params.get("artist"),
        params.get("track"),
        params.get("limit"),
        params.get("album"),
      ]);
      if (method === "track.getInfo") {
        return HttpResponse.json({
          track: { album: { image: [{ size: "extralarge", "#text": trackUrl }] } },
        });
      }
      if (method === "album.getInfo") {
        return HttpResponse.json({ album: { image: [{ size: "extralarge", "#text": albumUrl }] } });
      }
      return HttpResponse.json({
        topalbums: { album: [{ image: [{ size: "extralarge", "#text": artistUrl }] }] },
      });
    }),
  );
  const params = {
    tracks: [
      { name: "Covered Track", artist: "Example Artist", lastfmArtworkUrl: existingUrl },
      {
        name: "Missing Track",
        artist: "Example Artist",
        lastfmArtworkUrl:
          "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
      },
    ],
    artists: [
      { name: "Covered Artist", lastfmArtworkUrl: existingUrl },
      { name: "Missing Artist" },
    ],
    albums: [
      { name: "Covered Album", artist: "Example Artist", lastfmArtworkUrl: existingUrl },
      { name: "Missing Album", artist: "Example Artist" },
    ],
  };
  const result = await query.resolveMusicArtwork(params, new AbortController().signal);
  expect(result.tracks.map(({ name, artwork }) => [name, artwork?.imageUrl])).toEqual([
    ["Covered Track", existingUrl],
    ["Missing Track", trackUrl],
  ]);
  expect(result.artists.map(({ name, artwork }) => [name, artwork?.imageUrl])).toEqual([
    ["Covered Artist", existingUrl],
    ["Missing Artist", artistUrl],
  ]);
  expect(result.tracks[1]?.palette).toBeDefined();
  expect(result.artists[1]?.palette).toBeDefined();
  expect(result.albums.map(({ name, artwork }) => [name, artwork?.imageUrl])).toEqual([
    ["Covered Album", existingUrl],
    ["Missing Album", albumUrl],
  ]);
  expect(result.albums[1]?.palette).toBeDefined();
  expect(result.retryAfterMs).toBeUndefined();
  await query.resolveMusicArtwork(params, new AbortController().signal);
  expect(lookups).toEqual([
    ["track.getInfo", "Example Artist", "Missing Track", null, null],
    ["album.getInfo", "Example Artist", null, null, "Missing Album"],
    ["artist.getTopAlbums", "Missing Artist", null, "1", null],
  ]);
});

test("keeps artwork fresh throughout a retry cooldown when the tab remounts", async () => {
  const initialTime = Date.now();
  let now = initialTime;
  const dateNow = vi.spyOn(Date, "now").mockImplementation(() => now);
  onTestFinished(() => dateNow.mockRestore());
  const client = new QueryClient();
  onTestFinished(() => client.clear());
  const response = {
    tracks: [{ name: "Retry Song", artist: "Example Artist", artwork: undefined }],
    artists: [],
    albums: [],
    retryAfterMs: 30_000,
  };
  const queryFn = vi.fn<() => Promise<typeof response>>().mockResolvedValue(response);
  const options = {
    ...query.getMusicArtwork({
      tracks: [{ name: "Retry Song", artist: "Example Artist" }],
      artists: [],
      albums: [],
    }),
    queryFn,
  };
  client.setQueryData(options.queryKey, response);
  now += 20_000;
  const observer = new QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  onTestFinished(unsubscribe);
  expect(observer.getCurrentResult().isStale).toBe(false);
  expect(queryFn).not.toHaveBeenCalled();
  unsubscribe();
  now = initialTime + 30_001;
  const afterCooldown = new QueryObserver(client, options);
  const unsubscribeAfterCooldown = afterCooldown.subscribe(() => {});
  onTestFinished(unsubscribeAfterCooldown);
  await vi.waitFor(() => expect(queryFn).toHaveBeenCalledOnce());
});

test("filters unsafe and placeholder Last.fm image URLs", () => {
  const image = v.parse(imageSchema, [
    { size: "small", "#text": "https://lastfm.freetls.fastly.net/i/u/34x34/small.png" },
    { size: "large", "#text": "https://lastfm-img.freetls.fastly.net/i/u/300x300/real.jpg" },
    {
      size: "mega",
      "#text": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
    },
    { size: "extralarge", "#text": "http://lastfm.freetls.fastly.net/i/u/174s/extralarge.png" },
  ]);
  expect(image).toEqual({
    small: "https://lastfm.freetls.fastly.net/i/u/34x34/small.png",
    large: "https://lastfm.freetls.fastly.net/i/u/300x300/real.jpg",
  });
  expect(bestLastfmArtwork(image)).toBe("https://lastfm.freetls.fastly.net/i/u/300x300/real.jpg");
});

test("normalizes ranked album data and rejects placeholder cover art", () => {
  expect(
    v.parse(query.topAlbumSchema, {
      name: "Currents",
      artist: { name: "Tame Impala" },
      playcount: "42",
      "@attr": { rank: "1" },
      image: [
        {
          size: "extralarge",
          "#text":
            "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
        },
      ],
    }),
  ).toEqual({ name: "Currents", artist: "Tame Impala", playcount: 42, rank: 1 });
});

test("validates Last.fm artwork without replacing already resolved images", () => {
  const fallbackUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/fallback.png";
  const artwork = { imageUrl: "https://lastfm.freetls.fastly.net/i/u/300x300/resolved.png" };
  expect(
    addLastfmArtworkFallback([
      { name: "Fallback", lastfmArtworkUrl: fallbackUrl },
      { name: "Resolved", lastfmArtworkUrl: fallbackUrl, artwork },
      { name: "Unsafe", lastfmArtworkUrl: "https://127.0.0.1/image.png" },
    ]),
  ).toEqual([
    { name: "Fallback", artwork: { imageUrl: fallbackUrl } },
    { name: "Resolved", artwork },
    { name: "Unsafe" },
  ]);
});
