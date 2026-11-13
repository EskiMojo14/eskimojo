import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import sharp from "sharp";
import * as v from "valibot";
import { network } from "virtual:msw";
import { expect, onTestFinished, test, vi } from "vite-plus/test";

import {
  addLastfmArtworkFallback,
  bestLastfmArtwork,
  getMusicArtwork,
  imageSchema,
  recentTrackSchema,
  resolveMusicArtwork,
  topTrackSchema,
} from "./-query";

test("uses Last.fm artwork and palettes without contacting the other artwork providers", async () => {
  const image = await sharp({
    create: { width: 8, height: 8, channels: 4, background: "#2040ca" },
  })
    .png()
    .toBuffer();
  const lastfmArtworkUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/first-choice.png";
  let providerRequests = 0;
  network.use(
    http.get(
      lastfmArtworkUrl,
      () =>
        new HttpResponse(new Uint8Array(image), {
          headers: { "Content-Type": "image/png" },
        }),
    ),
    http.all(
      /https:\/\/(?:musicbrainz\.org|coverartarchive\.org|accounts\.spotify\.com|api\.spotify\.com)\//,
      () => {
        providerRequests++;
        return new HttpResponse(null, { status: 503 });
      },
    ),
  );
  const result = await resolveMusicArtwork(
    {
      tracks: [
        {
          name: "Last.fm Covered Song",
          artist: "Example Artist",
          lastfmArtworkUrl,
          recordingMbid: "dcb708f0-e0fb-4e1a-91d9-1510b6db4036",
          releaseMbid: "76df3287-6cda-33eb-8e9a-044b5e15ffdd",
        },
      ],
      artists: [{ name: "Last.fm Covered Artist", lastfmArtworkUrl }],
    },
    new AbortController().signal,
  );
  expect(result.tracks[0]?.artwork).toEqual({ imageUrl: lastfmArtworkUrl });
  expect(result.artists[0]?.artwork).toEqual({ imageUrl: lastfmArtworkUrl });
  expect(result.tracks[0]?.palette).toBeDefined();
  expect(result.artists[0]?.palette).toBeDefined();
  expect(result.retryAfterMs).toBeUndefined();
  expect(providerRequests).toBe(0);
});

test("looks up only missing or placeholder artwork and preserves track and artist order", async () => {
  vi.stubEnv("LASTFM_API_KEY", "lastfm-test-key");
  vi.stubEnv("LASTFM_USER", "test-user");
  vi.stubEnv("SPOTIFY_CLIENT_ID", "client-id");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "client-secret");
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
  const image = await sharp({
    create: { width: 8, height: 8, channels: 4, background: "#ca2020" },
  })
    .png()
    .toBuffer();
  const lastfmArtworkUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/primary-mixed.png";
  const coverUrl = "https://archive.org/download/mbid-example/missing-track.png";
  const spotifyUrl = "https://i.scdn.co/image/missing-artist";
  const releaseMbid = "f268b8bc-2768-426b-901b-c7966e76de29";
  const coverLookups: Array<string> = [];
  let spotifyLookups = 0;
  network.use(
    http.get(
      lastfmArtworkUrl,
      () =>
        new HttpResponse(new Uint8Array(image), {
          headers: { "Content-Type": "image/png" },
        }),
    ),
    http.head("https://coverartarchive.org/release/:mbid/front-250", ({ params }) => {
      coverLookups.push(String(params.mbid));
      return HttpResponse.redirect(coverUrl, 307);
    }),
    http.head(coverUrl, () => new HttpResponse(null, { headers: { "Content-Type": "image/png" } })),
    http.get(
      coverUrl,
      () => new HttpResponse(new Uint8Array(image), { headers: { "Content-Type": "image/png" } }),
    ),
    http.get(
      spotifyUrl,
      () => new HttpResponse(new Uint8Array(image), { headers: { "Content-Type": "image/png" } }),
    ),
    http.post("https://accounts.spotify.com/api/token", () =>
      HttpResponse.json({ access_token: "test-token", expires_in: 3600 }),
    ),
    http.get("https://api.spotify.com/v1/search", ({ request }) => {
      spotifyLookups++;
      expect(new URL(request.url).searchParams.get("q")).toBe("artist:Missing Artist");
      return HttpResponse.json({
        artists: {
          items: [
            {
              name: "Missing Artist",
              images: [{ url: spotifyUrl }],
              external_urls: { spotify: "https://open.spotify.com/artist/missing" },
            },
          ],
        },
      });
    }),
  );
  const result = await resolveMusicArtwork(
    {
      tracks: [
        {
          name: "Covered Track",
          artist: "Example Artist",
          lastfmArtworkUrl,
          releaseMbid: "76df3287-6cda-33eb-8e9a-044b5e15ffdd",
        },
        {
          name: "Missing Track",
          artist: "Example Artist",
          releaseMbid,
          lastfmArtworkUrl:
            "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
        },
      ],
      artists: [{ name: "Covered Artist", lastfmArtworkUrl }, { name: "Missing Artist" }],
    },
    new AbortController().signal,
  );
  expect(result.tracks.map(({ name, artwork }) => [name, artwork?.imageUrl])).toEqual([
    ["Covered Track", lastfmArtworkUrl],
    ["Missing Track", coverUrl],
  ]);
  expect(result.artists.map(({ name, artwork }) => [name, artwork?.imageUrl])).toEqual([
    ["Covered Artist", lastfmArtworkUrl],
    ["Missing Artist", spotifyUrl],
  ]);
  expect(coverLookups).toEqual([releaseMbid]);
  expect(spotifyLookups).toBe(1);
  expect(result.retryAfterMs).toBeUndefined();
});

test("retains recording and album release MBIDs without treating artist IDs as cover IDs", () => {
  const recordingMbid = "b1a9c0e9-d987-4042-ae91-78d6a3267d69";
  const releaseMbid = "76df3287-6cda-33eb-8e9a-044b5e15ffdd";
  const recent = v.parse(recentTrackSchema, {
    name: "Example Song",
    mbid: recordingMbid,
    artist: { "#text": "Example Artist", mbid: releaseMbid },
    album: { "#text": "Example Album", mbid: releaseMbid },
    "@attr": { nowplaying: "true" },
  });
  expect(recent).toMatchObject({
    name: "Example Song",
    artist: "Example Artist",
    album: "Example Album",
    recordingMbid,
    releaseMbid,
  });
  const ranked = v.parse(topTrackSchema, {
    name: "Example Song",
    mbid: recordingMbid,
    artist: { name: "Example Artist", mbid: releaseMbid },
    playcount: "10",
    "@attr": { rank: "1" },
  });
  expect(ranked.recordingMbid).toBe(recordingMbid);
  expect(ranked.releaseMbid).toBeUndefined();
  const noIds = v.parse(recentTrackSchema, {
    name: "Example Song",
    mbid: "",
    artist: { "#text": "Example Artist", mbid: releaseMbid },
    album: { "#text": "Example Album", mbid: "not-an-mbid" },
    date: { uts: "1700000000" },
  });
  expect(noIds.recordingMbid).toBeUndefined();
  expect(noIds.releaseMbid).toBeUndefined();
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
    retryAfterMs: 30_000,
  };
  const queryFn = vi.fn<() => Promise<typeof response>>().mockResolvedValue(response);
  const options = {
    ...getMusicArtwork({
      tracks: [{ name: "Retry Song", artist: "Example Artist" }],
      artists: [],
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
    {
      size: "large",
      "#text":
        "https://lastfm-img.freetls.fastly.net/i/u/300x300/c734c90aeb2e80c55c66ed8daf141af2.jpg",
    },
    {
      size: "mega",
      "#text": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
    },
    { size: "extralarge", "#text": "http://lastfm.freetls.fastly.net/i/u/174s/extralarge.png" },
  ]);

  expect(image).toEqual({
    small: "https://lastfm.freetls.fastly.net/i/u/34x34/small.png",
    large: "https://lastfm.freetls.fastly.net/i/u/300x300/c734c90aeb2e80c55c66ed8daf141af2.jpg",
  });
  expect(bestLastfmArtwork(image)).toBe(
    "https://lastfm.freetls.fastly.net/i/u/300x300/c734c90aeb2e80c55c66ed8daf141af2.jpg",
  );
});

test("validates Last.fm artwork without replacing already resolved images", () => {
  const fallbackUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/fallback.png";
  const spotifyArtwork = {
    imageUrl: "https://i.scdn.co/image/spotify",
    spotifyUrl: "https://open.spotify.com/track/example",
  };
  const result = addLastfmArtworkFallback([
    { name: "Fallback", lastfmArtworkUrl: fallbackUrl },
    { name: "Spotify", lastfmArtworkUrl: fallbackUrl, artwork: spotifyArtwork },
    { name: "Unsafe", lastfmArtworkUrl: "https://127.0.0.1/image.png" },
  ]);

  expect(result).toEqual([
    { name: "Fallback", artwork: { imageUrl: fallbackUrl } },
    { name: "Spotify", artwork: spotifyArtwork },
    { name: "Unsafe" },
  ]);
});
