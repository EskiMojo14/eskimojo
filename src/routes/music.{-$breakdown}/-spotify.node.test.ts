import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { beforeEach, expect, onTestFinished, test, vi } from "vite-plus/test";

import type * as SpotifyServer from "./-spotify.server";

let spotifyModule: typeof SpotifyServer;

beforeEach(async () => {
  vi.resetModules();
  spotifyModule = await import("./-spotify.server");
});

function configureCredentials() {
  vi.stubEnv("LASTFM_API_KEY", "lastfm-test-key");
  vi.stubEnv("LASTFM_USER", "test-user");
  vi.stubEnv("SPOTIFY_CLIENT_ID", "client-id");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "client-secret");
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
}

function mockTokenRequest() {
  let requests = 0;
  network.use(
    http.post("https://accounts.spotify.com/api/token", () => {
      requests++;
      return HttpResponse.json({
        access_token: "test-access-token",
        token_type: "Bearer",
        expires_in: 3600,
      });
    }),
  );
  return () => requests;
}

test("adds Spotify artwork and direct links for exact track and artist matches", async () => {
  configureCredentials();
  let tokenRequests = 0;
  let searchRequests = 0;
  network.use(
    http.post("https://accounts.spotify.com/api/token", ({ request }) => {
      tokenRequests++;
      expect(request.headers.get("authorization")).toBe(
        `Basic ${Buffer.from("client-id:client-secret").toString("base64")}`,
      );
      return HttpResponse.json({
        access_token: "test-access-token",
        token_type: "Bearer",
        expires_in: 3600,
      });
    }),
    http.get("https://api.spotify.com/v1/search", ({ request }) => {
      searchRequests++;
      const url = new URL(request.url);
      expect(request.headers.get("authorization")).toBe("Bearer test-access-token");
      expect(url.searchParams.get("market")).toBe("GB");
      expect(url.searchParams.get("limit")).toBe("10");
      const type = url.searchParams.get("type");
      expect(url.searchParams.get("q")).toBe(
        type === "track" ? "Let It Happen Tame Impala" : "artist:Radiohead",
      );
      if (type === "track") {
        return HttpResponse.json({
          tracks: {
            items: [
              {
                name: "Let It Happen",
                artists: [{ name: "Tame Impala" }],
                album: { images: [{ url: "https://i.scdn.co/image/currents" }] },
                external_urls: { spotify: "https://open.spotify.com/track/let-it-happen" },
              },
            ],
          },
        });
      }
      return HttpResponse.json({
        artists: {
          items: [
            {
              name: "Radiohead",
              images: [{ url: "https://i.scdn.co/image/radiohead" }],
              external_urls: { spotify: "https://open.spotify.com/artist/radiohead" },
            },
          ],
        },
      });
    }),
  );

  const signal = new AbortController().signal;
  const [track] = await spotifyModule.addSpotifyTrackArtwork(
    [{ name: "Let It Happen", artist: "Tame Impala" }],
    signal,
  );
  const [artist] = await spotifyModule.addSpotifyArtistArtwork([{ name: "Radiohead" }], signal);

  expect(track?.artwork).toEqual({
    imageUrl: "https://i.scdn.co/image/currents",
    spotifyUrl: "https://open.spotify.com/track/let-it-happen",
  });
  expect(artist?.artwork).toEqual({
    imageUrl: "https://i.scdn.co/image/radiohead",
    spotifyUrl: "https://open.spotify.com/artist/radiohead",
  });
  expect(tokenRequests).toBe(1);
  expect(searchRequests).toBe(2);
});

test("does not attach artwork from a similarly titled track by a different artist", async () => {
  configureCredentials();
  const tokenRequests = mockTokenRequest();
  let searchRequests = 0;
  network.use(
    http.get("https://api.spotify.com/v1/search", () => {
      searchRequests++;
      return HttpResponse.json({
        tracks: {
          items: [
            {
              name: "Same Song",
              artists: [{ name: "Different Artist" }],
              album: { images: [{ url: "https://i.scdn.co/image/wrong-album" }] },
              external_urls: { spotify: "https://open.spotify.com/track/wrong-match" },
            },
          ],
        },
      });
    }),
  );

  const [track] = await spotifyModule.addSpotifyTrackArtwork(
    [{ name: "Same Song", artist: "Expected Artist" }],
    new AbortController().signal,
  );

  expect(track).toEqual({ name: "Same Song", artist: "Expected Artist" });
  expect(tokenRequests()).toBe(1);
  expect(searchRequests).toBe(1);
});

test("keeps listening data when Spotify lookup fails and reports the failure", async () => {
  configureCredentials();
  const tokenRequests = mockTokenRequest();
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  onTestFinished(() => error.mockRestore());
  let searchRequests = 0;
  network.use(
    http.get("https://api.spotify.com/v1/search", () => {
      searchRequests++;
      return new HttpResponse(null, { status: 503 });
    }),
  );

  const item = { name: "Unavailable Song", artist: "Example Artist" };
  const [result] = await spotifyModule.addSpotifyTrackArtwork([item], new AbortController().signal);

  expect(result).toEqual(item);
  expect(error).toHaveBeenCalledOnce();
  expect(tokenRequests()).toBe(1);
  expect(searchRequests).toBe(1);
});

test("keeps listening data available when Spotify credentials are not configured", async () => {
  configureCredentials();
  vi.stubEnv("SPOTIFY_CLIENT_ID", "");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "");
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  onTestFinished(() => error.mockRestore());
  let tokenRequests = 0;
  let searchRequests = 0;
  network.use(
    http.post("https://accounts.spotify.com/api/token", () => {
      tokenRequests++;
      return HttpResponse.json({ access_token: "test-access-token", expires_in: 3600 });
    }),
    http.get("https://api.spotify.com/v1/search", () => {
      searchRequests++;
      return HttpResponse.json({ tracks: { items: [] } });
    }),
  );

  const item = { name: "Unavailable Song", artist: "Example Artist" };
  const [result] = await spotifyModule.addSpotifyTrackArtwork([item], new AbortController().signal);

  expect(result).toEqual(item);
  expect(error).toHaveBeenCalledOnce();
  expect(tokenRequests).toBe(0);
  expect(searchRequests).toBe(0);
});

test("cancels one caller's token wait without cancelling the shared token request", async () => {
  configureCredentials();
  const tokenResponse = Promise.withResolvers<Response>();
  const tokenRequestStarted = Promise.withResolvers<void>();
  let tokenRequests = 0;
  let searchRequests = 0;
  network.use(
    http.post("https://accounts.spotify.com/api/token", () => {
      tokenRequests++;
      tokenRequestStarted.resolve();
      return tokenResponse.promise;
    }),
    http.get("https://api.spotify.com/v1/search", () => {
      searchRequests++;
      return HttpResponse.json({
        tracks: {
          items: [
            {
              name: "Active Song",
              artists: [{ name: "Example Artist" }],
              album: { images: [{ url: "https://i.scdn.co/image/active-song" }] },
              external_urls: { spotify: "https://open.spotify.com/track/active-song" },
            },
          ],
        },
      });
    }),
  );

  const cancelledController = new AbortController();
  const cancelledLookup = spotifyModule.addSpotifyTrackArtwork(
    [{ name: "Cancelled Song", artist: "Example Artist" }],
    cancelledController.signal,
  );
  await tokenRequestStarted.promise;

  const activeLookup = spotifyModule.addSpotifyTrackArtwork(
    [{ name: "Active Song", artist: "Example Artist" }],
    new AbortController().signal,
  );
  cancelledController.abort(new Error("caller cancelled"));
  await expect(cancelledLookup).rejects.toThrow("caller cancelled");
  tokenResponse.resolve(
    HttpResponse.json({
      access_token: "test-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    }),
  );

  const [activeTrack] = await activeLookup;
  expect(activeTrack?.artwork).toEqual({
    imageUrl: "https://i.scdn.co/image/active-song",
    spotifyUrl: "https://open.spotify.com/track/active-song",
  });
  expect(tokenRequests).toBe(1);
  expect(searchRequests).toBe(1);
});

test("falls back to listening data when Spotify enrichment exceeds its deadline", async () => {
  configureCredentials();
  const deadline = new AbortController();
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  const timeoutSpy = vi
    .spyOn(AbortSignal, "timeout")
    .mockReturnValueOnce(deadline.signal)
    .mockImplementation(originalTimeout);
  onTestFinished(() => timeoutSpy.mockRestore());

  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());

  let tokenRequests = 0;
  let searchRequests = 0;
  const searchesStarted = Promise.withResolvers<void>();
  const searchGate = Promise.withResolvers<void>();
  network.use(
    http.post("https://accounts.spotify.com/api/token", () => {
      tokenRequests++;
      return HttpResponse.json({
        access_token: "test-access-token",
        token_type: "Bearer",
        expires_in: 3600,
      });
    }),
    http.get("https://api.spotify.com/v1/search", async () => {
      searchRequests++;
      if (searchRequests === 3) searchesStarted.resolve();
      await searchGate.promise;
      return HttpResponse.json({ tracks: { items: [] } });
    }),
  );

  const items = Array.from({ length: 4 }, (_, index) => ({
    name: `Slow Song ${index + 1}`,
    artist: "Example Artist",
  }));
  const lookup = spotifyModule.addSpotifyTrackArtwork(items, new AbortController().signal);
  await searchesStarted.promise;
  deadline.abort(new DOMException("Spotify enrichment timed out", "TimeoutError"));
  searchGate.resolve();

  await expect(lookup).resolves.toEqual(items);
  expect(tokenRequests).toBe(1);
  expect(searchRequests).toBe(3);
  expect(warning).toHaveBeenCalledOnce();
});

test("falls back to listening data when Spotify authentication exceeds its deadline", async () => {
  configureCredentials();
  const deadline = new AbortController();
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  const timeoutSpy = vi
    .spyOn(AbortSignal, "timeout")
    .mockReturnValueOnce(deadline.signal)
    .mockImplementation(originalTimeout);
  onTestFinished(() => timeoutSpy.mockRestore());

  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());

  const tokenResponse = Promise.withResolvers<Response>();
  const tokenRequestStarted = Promise.withResolvers<void>();
  let tokenRequests = 0;
  let searchRequests = 0;
  network.use(
    http.post("https://accounts.spotify.com/api/token", () => {
      tokenRequests++;
      tokenRequestStarted.resolve();
      return tokenResponse.promise;
    }),
    http.get("https://api.spotify.com/v1/search", () => {
      searchRequests++;
      return HttpResponse.json({ tracks: { items: [] } });
    }),
  );

  const item = { name: "Slow Authentication", artist: "Example Artist" };
  const lookup = spotifyModule.addSpotifyTrackArtwork([item], new AbortController().signal);
  await tokenRequestStarted.promise;
  deadline.abort(new DOMException("Spotify enrichment timed out", "TimeoutError"));
  tokenResponse.resolve(
    HttpResponse.json({
      access_token: "test-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    }),
  );

  await expect(lookup).resolves.toEqual([item]);
  expect(tokenRequests).toBe(1);
  expect(searchRequests).toBe(0);
  expect(warning).toHaveBeenCalledOnce();
});
