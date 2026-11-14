import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { beforeEach, expect, onTestFinished, test, vi } from "vite-plus/test";

import { disposablePromise } from "#/utils";

import type * as LastfmArtwork from "./-lastfm-artwork.server";

let artwork: typeof LastfmArtwork;
const api = "https://ws.audioscrobbler.com/2.0/";
const track = { name: "Example Song", artist: "Example Artist" };
const imageUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/cover.png";
const trackResponse = { track: { album: { image: [{ size: "extralarge", "#text": imageUrl }] } } };

beforeEach(async () => {
  vi.resetModules();
  artwork = await import("./-lastfm-artwork.server");
  vi.stubEnv("LASTFM_API_KEY", "lastfm-test-key");
  vi.stubEnv("LASTFM_USER", "test-user");
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
});

test("deduplicates tracks and caches both successful covers and completed misses", async () => {
  let requests = 0;
  network.use(
    http.get(api, ({ request }) => {
      requests++;
      return HttpResponse.json(
        new URL(request.url).searchParams.get("track") === "Missing"
          ? { track: {} }
          : trackResponse,
      );
    }),
  );
  const items = [track, { ...track, name: "Missing" }, track];
  const result = await artwork.addLastfmTrackArtwork(items, new AbortController().signal);
  expect(result.items.map((item) => item.artwork?.imageUrl)).toEqual([
    imageUrl,
    undefined,
    imageUrl,
  ]);
  expect(result.incomplete).toBe(false);
  await artwork.addLastfmTrackArtwork(items, new AbortController().signal);
  expect(requests).toBe(2);
});

test("treats a Last.fm not-found response and empty top albums as completed misses", async () => {
  network.use(
    http.get(api, ({ request }) =>
      HttpResponse.json(
        new URL(request.url).searchParams.get("method") === "track.getInfo"
          ? { error: 6, message: "Track not found" }
          : { topalbums: { album: [] } },
      ),
    ),
  );
  expect(await artwork.addLastfmTrackArtwork([track], new AbortController().signal)).toEqual({
    items: [track],
    incomplete: false,
  });
  const artists = [{ name: "Unknown Artist" }];
  expect(await artwork.addLastfmArtistArtwork(artists, new AbortController().signal)).toEqual({
    items: artists,
    incomplete: false,
  });
});

test("does not cache transient lookup failures", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  let requests = 0;
  network.use(
    http.get(api, () => {
      requests++;
      return requests === 1
        ? HttpResponse.json({ error: 16, message: "Temporary failure" })
        : HttpResponse.json(trackResponse);
    }),
  );
  expect(
    (await artwork.addLastfmTrackArtwork([track], new AbortController().signal)).incomplete,
  ).toBe(true);
  const recovered = await artwork.addLastfmTrackArtwork([track], new AbortController().signal);
  expect(recovered.items[0]?.artwork).toEqual({ imageUrl });
  expect(recovered.incomplete).toBe(false);
  expect(requests).toBe(2);
  expect(warning).toHaveBeenCalledOnce();
});

test("pauses queued lookups after API rate limiting without repeating failure logs", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  let requests = 0;
  network.use(
    http.get(api, () => {
      requests++;
      return requests === 1
        ? HttpResponse.json({ error: 29, message: "Rate limit exceeded" })
        : HttpResponse.json(trackResponse);
    }),
  );
  const items = [track, { ...track, name: "Queued Track" }];
  const paused = await artwork.addLastfmTrackArtwork(items, new AbortController().signal);
  expect(paused.incomplete).toBe(true);
  await artwork.addLastfmTrackArtwork(items, new AbortController().signal);
  expect(requests).toBe(1);
  expect(warning).toHaveBeenCalledOnce();
  const now = Date.now();
  const clock = vi.spyOn(Date, "now").mockReturnValue(now + 31_000);
  onTestFinished(() => clock.mockRestore());
  const recovered = await artwork.addLastfmTrackArtwork([track], new AbortController().signal);
  expect(recovered.items[0]?.artwork).toEqual({ imageUrl });
  expect(recovered.incomplete).toBe(false);
});

test("honors longer HTTP Retry-After cooldowns", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  let requests = 0;
  network.use(
    http.get(api, () => {
      requests++;
      return HttpResponse.json(
        { error: 29, message: "Rate limit exceeded" },
        {
          status: 429,
          headers: { "Retry-After": "90" },
        },
      );
    }),
  );
  await artwork.addLastfmTrackArtwork(
    [track, { ...track, name: "Queued Track" }],
    new AbortController().signal,
  );
  expect(artwork.getLastfmArtworkRetryAfter()).toBeGreaterThan(89_000);
  expect(requests).toBe(1);
  expect(warning).toHaveBeenCalledOnce();
});

test("returns incomplete artwork on the lookup deadline instead of hiding tracks", async () => {
  const deadline = new AbortController();
  const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
  onTestFinished(() => timeout.mockRestore());
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  using started = disposablePromise();
  using pending = disposablePromise();
  network.use(
    http.get(api, async () => {
      started.resolve();
      await pending.promise;
      return HttpResponse.json(trackResponse);
    }),
  );
  const request = artwork.addLastfmTrackArtwork([track], new AbortController().signal);
  await started.promise;
  deadline.abort(new DOMException("Artwork timed out", "TimeoutError"));
  expect(await request).toEqual({ items: [track], incomplete: true });
  expect(warning).toHaveBeenCalledOnce();
});

test("propagates caller cancellation without logging an artwork failure", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  using started = disposablePromise();
  using pending = disposablePromise();
  network.use(
    http.get(api, async () => {
      started.resolve();
      await pending.promise;
      return HttpResponse.json(trackResponse);
    }),
  );
  const controller = new AbortController();
  onTestFinished(() => controller.abort());
  const reason = new DOMException("Cancelled", "AbortError");
  const request = artwork.addLastfmTrackArtwork([track], controller.signal);
  const cancellation = started.promise.then(() => controller.abort(reason));
  await expect(request).rejects.toBe(reason);
  await cancellation;
  expect(warning).not.toHaveBeenCalled();
});
