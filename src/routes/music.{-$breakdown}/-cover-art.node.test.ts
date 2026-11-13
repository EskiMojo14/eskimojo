import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { beforeEach, expect, onTestFinished, test, vi } from "vite-plus/test";

import type * as CoverArt from "./-cover-art.server";
import { addLastfmArtworkFallback } from "./-query";

let coverArt: typeof CoverArt;
const releaseMbid = "76df3287-6cda-33eb-8e9a-044b5e15ffdd";
const recordingMbid = "b1a9c0e9-d987-4042-ae91-78d6a3267d69";
const coverUrl = `https://coverartarchive.org/release/${releaseMbid}/front-250`;
const imageUrl = `https://dn711103.ca.archive.org/0/items/mbid-${releaseMbid}/front.jpg`;
const track = { name: "Example Song", artist: "Example Artist" };

beforeEach(async () => {
  vi.resetModules();
  coverArt = await import("./-cover-art.server");
  vi.stubEnv("LASTFM_API_KEY", "lastfm-test-key");
  vi.stubEnv("LASTFM_USER", "test-user");
  vi.stubEnv("SPOTIFY_CLIENT_ID", "client-id");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "client-secret");
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });
});

function mockCover() {
  network.use(
    http.head(coverUrl, () =>
      HttpResponse.redirect(`https://archive.org/download/mbid-${releaseMbid}/front.jpg`, 307),
    ),
    http.head(`https://archive.org/download/mbid-${releaseMbid}/front.jpg`, () =>
      HttpResponse.redirect(imageUrl, 302),
    ),
    http.head(
      imageUrl,
      () => new HttpResponse(null, { headers: { "Content-Type": "image/jpeg" } }),
    ),
  );
}

function mockSpotify(fail = false) {
  let searches = 0;
  network.use(
    http.post("https://accounts.spotify.com/api/token", () =>
      HttpResponse.json({ access_token: "test-token", expires_in: 3600 }),
    ),
    http.get("https://api.spotify.com/v1/search", () => {
      searches++;
      return fail
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json({
            tracks: {
              items: [
                {
                  name: track.name,
                  artists: [{ name: track.artist }],
                  album: { images: [{ url: "https://i.scdn.co/image/example" }] },
                  external_urls: { spotify: "https://open.spotify.com/track/example" },
                },
              ],
            },
          });
    }),
  );
  return () => searches;
}

test("prefers release cover art, follows only supported redirects, and caches the result", async () => {
  mockCover();
  const searches = mockSpotify();
  let requests = 0;
  network.use(
    http.head(coverUrl, () => {
      requests++;
      return HttpResponse.redirect(imageUrl, 307);
    }),
  );
  const items = [{ ...track, releaseMbid }];
  const first = await coverArt.addTrackArtwork(items, new AbortController().signal);
  const second = await coverArt.addTrackArtwork(items, new AbortController().signal);

  expect(first).toEqual({ items: [{ ...items[0], artwork: { imageUrl } }], incomplete: false });
  expect(second).toEqual(first);
  expect(requests).toBe(1);
  expect(searches()).toBe(0);
});

test("resolves recording MBIDs through MusicBrainz before trying Spotify", async () => {
  mockCover();
  const searches = mockSpotify();
  network.use(
    http.get(`https://musicbrainz.org/ws/2/recording/${recordingMbid}`, ({ request }) => {
      expect(new URL(request.url).searchParams.get("inc")).toBe("releases");
      expect(request.headers.get("user-agent")).toContain("https://github.com/EskiMojo14/eskimojo");
      return HttpResponse.json({ releases: [{ id: releaseMbid }] });
    }),
  );

  const result = await coverArt.addTrackArtwork(
    [{ ...track, recordingMbid }],
    new AbortController().signal,
  );
  expect(result.items[0]?.artwork).toEqual({ imageUrl });
  expect(result.incomplete).toBe(false);
  expect(searches()).toBe(0);
});

test("supports album MBIDs that identify release groups rather than releases", async () => {
  const searches = mockSpotify();
  network.use(
    http.head(coverUrl, () => new HttpResponse(null, { status: 404 })),
    http.head(`https://coverartarchive.org/release-group/${releaseMbid}/front-250`, () =>
      HttpResponse.redirect(imageUrl, 307),
    ),
    http.head(
      imageUrl,
      () => new HttpResponse(null, { headers: { "Content-Type": "image/jpeg" } }),
    ),
  );
  const result = await coverArt.addTrackArtwork(
    [{ ...track, releaseMbid }],
    new AbortController().signal,
  );
  expect(result.items[0]?.artwork).toEqual({ imageUrl });
  expect(result.incomplete).toBe(false);
  expect(searches()).toBe(0);
});

test("tries another release when the recording's first release has no front cover", async () => {
  const otherRelease = "f268b8bc-2768-426b-901b-c7966e76de29";
  mockCover();
  network.use(
    http.get(`https://musicbrainz.org/ws/2/recording/${recordingMbid}`, () =>
      HttpResponse.json({ releases: [{ id: otherRelease }, { id: releaseMbid }] }),
    ),
    http.head(
      `https://coverartarchive.org/release/${otherRelease}/front-250`,
      () => new HttpResponse(null, { status: 404 }),
    ),
  );
  const result = await coverArt.addCoverArtArtwork(
    [{ ...track, recordingMbid }],
    new AbortController().signal,
  );
  expect(result.items[0]?.artwork).toEqual({ imageUrl });
  expect(result.incomplete).toBe(false);
});

test("stops a timed-out cover lookup without losing the item or caching the failure", async () => {
  const deadline = new AbortController();
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  const timeoutSpy = vi
    .spyOn(AbortSignal, "timeout")
    .mockReturnValueOnce(deadline.signal)
    .mockImplementation(originalTimeout);
  onTestFinished(() => timeoutSpy.mockRestore());
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  const started = Promise.withResolvers<void>();
  const response = Promise.withResolvers<Response>();
  onTestFinished(() => response.resolve(new HttpResponse(null, { status: 404 })));
  network.use(
    http.head(coverUrl, () => {
      started.resolve();
      return response.promise;
    }),
  );
  const items = [{ ...track, releaseMbid }];
  const lookup = coverArt.addCoverArtArtwork(items, new AbortController().signal);
  await started.promise;
  deadline.abort(new DOMException("Cover lookup timed out", "TimeoutError"));
  await expect(lookup).resolves.toEqual({ items, incomplete: true });

  mockCover();
  const retry = await coverArt.addCoverArtArtwork(items, new AbortController().signal);
  expect(retry.items[0]?.artwork).toEqual({ imageUrl });
  expect(retry.incomplete).toBe(false);
});

test("tries Spotify for missing cover art or missing MBIDs and preserves track order", async () => {
  const searches = mockSpotify();
  network.use(
    http.head(coverUrl, () => new HttpResponse(null, { status: 404 })),
    http.head(
      `https://coverartarchive.org/release-group/${releaseMbid}/front-250`,
      () => new HttpResponse(null, { status: 404 }),
    ),
  );
  const items = [{ ...track, releaseMbid }, track];
  const result = await coverArt.addTrackArtwork(items, new AbortController().signal);
  expect(result.items.map(({ name, artwork }) => ({ name, artwork }))).toEqual(
    items.map(({ name }) => ({
      name,
      artwork: {
        imageUrl: "https://i.scdn.co/image/example",
        spotifyUrl: "https://open.spotify.com/track/example",
      },
    })),
  );
  expect(result.incomplete).toBe(false);
  expect(searches()).toBeGreaterThan(0);
});

test("falls back to Last.fm on provider failure and retries transient cover failures", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  onTestFinished(() => {
    warning.mockRestore();
    error.mockRestore();
  });
  const searches = mockSpotify(true);
  let available = false;
  network.use(
    http.head(coverUrl, () =>
      available ? HttpResponse.redirect(imageUrl, 307) : new HttpResponse(null, { status: 503 }),
    ),
  );
  network.use(
    http.head(
      imageUrl,
      () => new HttpResponse(null, { headers: { "Content-Type": "image/jpeg" } }),
    ),
  );
  const lastfmArtworkUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/example.jpg";
  const items = [{ ...track, releaseMbid, lastfmArtworkUrl }];
  const failed = await coverArt.addTrackArtwork(items, new AbortController().signal);
  expect(failed.incomplete).toBe(true);
  expect(addLastfmArtworkFallback(failed.items)[0]?.artwork).toEqual({
    imageUrl: lastfmArtworkUrl,
  });

  available = true;
  const recovered = await coverArt.addTrackArtwork(items, new AbortController().signal);
  expect(recovered.items[0]?.artwork).toEqual({ imageUrl });
  expect(recovered.incomplete).toBe(false);
  expect(searches()).toBe(1);
});

test("rejects private and lookalike cover redirect destinations before making a request", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  let forbiddenRequests = 0;
  network.use(
    http.head(coverUrl, () => HttpResponse.redirect("https://127.0.0.1/private", 307)),
    http.head("https://127.0.0.1/private", () => {
      forbiddenRequests++;
      return new HttpResponse(null);
    }),
  );
  const result = await coverArt.addCoverArtArtwork(
    [{ ...track, releaseMbid }],
    new AbortController().signal,
  );
  expect(result.incomplete).toBe(true);
  expect(forbiddenRequests).toBe(0);
  expect(coverArt.isCoverArtHost("archive.org.evil.example")).toBe(false);
});

test("spaces MusicBrainz recording requests at least one second apart", async () => {
  const times: Array<number> = [];
  network.use(
    http.get("https://musicbrainz.org/ws/2/recording/:mbid", () => {
      times.push(Date.now());
      return HttpResponse.json({ releases: [] });
    }),
  );
  await coverArt.addCoverArtArtwork(
    [
      { ...track, recordingMbid },
      { ...track, recordingMbid: "f3b2bb87-ea12-4930-a8a0-898f6be6bf7c" },
    ],
    new AbortController().signal,
  );
  expect(times).toHaveLength(2);
  expect((times[1] ?? 0) - (times[0] ?? 0)).toBeGreaterThanOrEqual(1000);
});

test("follows a merged MusicBrainz recording ID to its canonical recording", async () => {
  const mergedMbid = "dcb708f0-e0fb-4e1a-91d9-1510b6db4036";
  const canonicalMbid = "3b9f187f-48a6-4b6d-868a-7443786f654e";
  mockCover();
  network.use(
    http.get(`https://musicbrainz.org/ws/2/recording/${mergedMbid}`, () =>
      HttpResponse.redirect(
        `https://musicbrainz.org/ws/2/recording/${canonicalMbid}?inc=releases&fmt=json`,
        301,
      ),
    ),
    http.get(`https://musicbrainz.org/ws/2/recording/${canonicalMbid}`, () =>
      HttpResponse.json({ releases: [{ id: releaseMbid }] }),
    ),
  );
  const result = await coverArt.addCoverArtArtwork(
    [{ ...track, recordingMbid: mergedMbid }],
    new AbortController().signal,
  );
  expect(result.incomplete).toBe(false);
  expect(result.items[0]?.artwork).toEqual({ imageUrl });
});

test("pauses MusicBrainz lookups after a 503 instead of sending queued and repeated requests", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  let now = Date.now();
  const dateNow = vi.spyOn(Date, "now").mockImplementation(() => now);
  onTestFinished(() => dateNow.mockRestore());
  let requests = 0;
  mockCover();
  network.use(
    http.get("https://musicbrainz.org/ws/2/recording/:mbid", () => {
      requests++;
      return requests === 1
        ? new HttpResponse(null, { status: 503, headers: { "Retry-After": "120" } })
        : HttpResponse.json({ releases: [{ id: releaseMbid }] });
    }),
  );
  const items = [
    { ...track, recordingMbid },
    { ...track, recordingMbid: "f3b2bb87-ea12-4930-a8a0-898f6be6bf7c" },
  ];
  const signal = new AbortController().signal;
  const first = await coverArt.addCoverArtArtwork(items, signal);
  now += 20_000;
  const retry = await coverArt.addCoverArtArtwork(items, signal);
  expect(first.incomplete).toBe(true);
  expect(retry.incomplete).toBe(true);
  expect(requests).toBe(1);
  expect(coverArt.getMusicbrainzRetryAfter()).toBe(100_000);
  expect(warning).toHaveBeenCalledOnce();

  now += 100_001;
  const recovered = await coverArt.addCoverArtArtwork([{ ...track, recordingMbid }], signal);
  expect(recovered.incomplete).toBe(false);
  expect(recovered.items[0]?.artwork).toEqual({ imageUrl });
  expect(requests).toBe(2);
  expect(coverArt.getMusicbrainzRetryAfter()).toBeUndefined();
});

test("does not follow a MusicBrainz recording redirect to a private destination", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  let privateRequests = 0;
  network.use(
    http.get(`https://musicbrainz.org/ws/2/recording/${recordingMbid}`, () =>
      HttpResponse.redirect(
        "https://127.0.0.1/ws/2/recording/3b9f187f-48a6-4b6d-868a-7443786f654e",
        301,
      ),
    ),
    http.get("https://127.0.0.1/*", () => {
      privateRequests++;
      return HttpResponse.json({ releases: [] });
    }),
  );
  const result = await coverArt.addCoverArtArtwork(
    [{ ...track, recordingMbid }],
    new AbortController().signal,
  );
  expect(result.incomplete).toBe(true);
  expect(privateRequests).toBe(0);
});
