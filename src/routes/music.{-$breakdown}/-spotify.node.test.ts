import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, onTestFinished, test, vi } from "vite-plus/test";

import { addSpotifyArtistArtwork, addSpotifyTrackArtwork } from "./-spotify.server";

function configureCredentials() {
  vi.stubEnv("LASTFM_API_KEY", "lastfm-test-key");
  vi.stubEnv("LASTFM_USER", "test-user");
  vi.stubEnv("SPOTIFY_CLIENT_ID", "client-id");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "client-secret");
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
}

test("adds Spotify artwork and direct links for exact track and artist matches", async () => {
  configureCredentials();
  let tokenRequests = 0;
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
  const [track] = await addSpotifyTrackArtwork(
    [{ name: "Let It Happen", artist: "Tame Impala" }],
    signal,
  );
  const [artist] = await addSpotifyArtistArtwork([{ name: "Radiohead" }], signal);

  expect(track?.artwork).toEqual({
    imageUrl: "https://i.scdn.co/image/currents",
    spotifyUrl: "https://open.spotify.com/track/let-it-happen",
  });
  expect(artist?.artwork).toEqual({
    imageUrl: "https://i.scdn.co/image/radiohead",
    spotifyUrl: "https://open.spotify.com/artist/radiohead",
  });
  expect(tokenRequests).toBe(1);
});

test("does not attach artwork from a similarly titled track by a different artist", async () => {
  configureCredentials();
  network.use(
    http.get("https://api.spotify.com/v1/search", () =>
      HttpResponse.json({
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
      }),
    ),
  );

  const [track] = await addSpotifyTrackArtwork(
    [{ name: "Same Song", artist: "Expected Artist" }],
    new AbortController().signal,
  );

  expect(track).toEqual({ name: "Same Song", artist: "Expected Artist" });
});

test("keeps listening data when Spotify lookup fails and reports the failure", async () => {
  configureCredentials();
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  onTestFinished(() => error.mockRestore());
  network.use(
    http.get("https://api.spotify.com/v1/search", () => new HttpResponse(null, { status: 503 })),
  );

  const item = { name: "Unavailable Song", artist: "Example Artist" };
  const [result] = await addSpotifyTrackArtwork([item], new AbortController().signal);

  expect(result).toEqual(item);
  expect(error).toHaveBeenCalledOnce();
});

test("keeps listening data available when Spotify credentials are not configured", async () => {
  configureCredentials();
  vi.stubEnv("SPOTIFY_CLIENT_ID", "");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "");
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  onTestFinished(() => error.mockRestore());

  const item = { name: "Unavailable Song", artist: "Example Artist" };
  const [result] = await addSpotifyTrackArtwork([item], new AbortController().signal);

  expect(result).toEqual(item);
  expect(error).toHaveBeenCalledOnce();
});
