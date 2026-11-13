import * as v from "valibot";
import { expect, test } from "vite-plus/test";

import { addLastfmArtworkFallback, bestLastfmArtwork, imageSchema } from "./-query";

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
