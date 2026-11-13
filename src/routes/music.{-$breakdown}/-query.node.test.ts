import { QueryClient, QueryObserver } from "@tanstack/react-query";
import * as v from "valibot";
import { expect, onTestFinished, test, vi } from "vite-plus/test";

import {
  addLastfmArtworkFallback,
  bestLastfmArtwork,
  getSpotifyArtwork,
  imageSchema,
} from "./-query";

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
    ...getSpotifyArtwork({
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

test("uses Last.fm artwork only when Spotify art is unavailable and the URL is supported", () => {
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
