import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, onTestFinished, test, vi } from "vite-plus/test";

import { disposablePromise } from "#/utils";

import { getMusicArtwork, getMusicArtworkFn } from "./-query";

test("reuses artwork cached with omitted groups for requests with explicit empty groups", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  onTestFinished(() => client.clear());
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  onTestFinished(() => log.mockRestore());
  let requests = 0;
  network.use(
    http.post(getMusicArtworkFn.url, () => {
      requests++;
      return HttpResponse.text("Service unavailable", { status: 503 });
    }),
  );
  const artists = [{ name: "Example Artist" }];
  const result = await client.query(getMusicArtwork({ artists }));
  expect(result).toEqual({
    tracks: [],
    albums: [],
    artists,
    retryAfterMs: 30_000,
  });
  const cachedResult = await client.query(getMusicArtwork({ tracks: [], albums: [], artists }));
  expect(cachedResult).toEqual(result);
  expect(requests).toBe(1);
});

test("skips the artwork request when all groups are omitted", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  onTestFinished(() => client.clear());
  let requests = 0;
  network.use(
    http.post(getMusicArtworkFn.url, () => {
      requests++;
      return HttpResponse.text("Unexpected artwork request", { status: 500 });
    }),
  );
  await expect(client.query(getMusicArtwork({}))).resolves.toEqual({
    tracks: [],
    albums: [],
    artists: [],
    retryAfterMs: undefined,
  });
  expect(requests).toBe(0);
});

test("recovers a failed artwork POST with validated images and a retry delay", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  onTestFinished(() => client.clear());
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  onTestFinished(() => log.mockRestore());
  network.use(
    http.post(getMusicArtworkFn.url, () =>
      HttpResponse.text("Service unavailable", { status: 503 }),
    ),
  );
  const legacyUrl = "https://lastfm-img.freetls.fastly.net/i/u/300x300/cover.png";
  const normalizedUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/cover.png";
  const options = getMusicArtwork({
    tracks: [
      { name: "Covered", artist: "Example Artist", lastfmArtworkUrl: legacyUrl },
      { name: "Unsafe", artist: "Example Artist", lastfmArtworkUrl: "https://127.0.0.1/image.png" },
      {
        name: "Placeholder",
        artist: "Example Artist",
        lastfmArtworkUrl:
          "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png",
      },
    ],
    artists: [{ name: "Covered Artist", lastfmArtworkUrl: legacyUrl }, { name: "Missing Artist" }],
    albums: [{ name: "Covered Album", artist: "Example Artist", lastfmArtworkUrl: legacyUrl }],
  });

  const result = await client.query(options);
  expect(result).toEqual({
    tracks: [
      { name: "Covered", artist: "Example Artist", artwork: { imageUrl: normalizedUrl } },
      { name: "Unsafe", artist: "Example Artist" },
      { name: "Placeholder", artist: "Example Artist" },
    ],
    artists: [
      { name: "Covered Artist", artwork: { imageUrl: normalizedUrl } },
      { name: "Missing Artist" },
    ],
    retryAfterMs: 30_000,
    albums: [
      { name: "Covered Album", artist: "Example Artist", artwork: { imageUrl: normalizedUrl } },
    ],
  });
  expect(log).toHaveBeenCalledWith(
    "Failed to load music artwork; using Last.fm artwork or icons.",
    expect.anything(),
  );
});

test("propagates artwork request cancellation without logging or caching fallback data", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  onTestFinished(() => client.clear());
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  onTestFinished(() => log.mockRestore());
  using started = disposablePromise();
  using pending = disposablePromise();
  network.use(
    http.post(getMusicArtworkFn.url, async () => {
      started.resolve();
      await pending.promise;
      return HttpResponse.text("Service unavailable", { status: 503 });
    }),
  );
  const controller = new AbortController();
  onTestFinished(() => controller.abort());
  const options = getMusicArtwork(
    {
      tracks: [{ name: "Cancelled Track", artist: "Example Artist" }],
    },
    controller.signal,
  );
  const reason = new DOMException("Artwork request cancelled", "AbortError");
  const request = client.query(options);
  const cancellation = started.promise.then(() => controller.abort(reason));
  await expect(request).rejects.toBe(reason);
  await cancellation;
  expect(client.getQueryData(options.queryKey)).toBeUndefined();
  expect(log).not.toHaveBeenCalled();
});
