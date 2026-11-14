import { http, HttpResponse } from "msw";
import type { Locator, Page } from "playwright";

import { HomePage } from "#/routes/_home/-index.e2e.model";
import { disposablePromise } from "#/utils";
import { createTest, expect } from "#test/e2e";
import { mockServerFn } from "#test/e2e/msw";
import { serverFns } from "#test/e2e/server-fns.gen";

import { MusicPage } from "./-index.e2e.model";
import type {
  getMusicArtwork,
  RecentTrack,
  TopAlbum,
  TopArtist,
  TopTrack,
  UserData,
} from "./-query";

const test = createTest({ home: HomePage, music: MusicPage });

/** Fast-forwards through React Query's retry backoff until `locator` is visible. */
async function skipRetryBackoff(page: Page, locator: Locator) {
  await expect
    .poll(async () => {
      await page.clock.fastForward("00:05");
      return locator.isVisible();
    })
    .toBe(true);
}

const user: UserData = {
  playcount: 100,
  artist_count: 10,
  album_count: 20,
  track_count: 30,
  registered: { unixtime: 1506038400 },
};

const recentTracks: Array<RecentTrack> = [
  {
    name: "Let It Happen",
    artist: "Tame Impala",
    album: "Currents",
    nowPlaying: true,
  },
];

const recentTracksWithNowPlaying: Array<RecentTrack> = [
  ...recentTracks,
  ...Array.from({ length: 10 }, (_, index) => ({
    name: `Recent Track ${index + 1}`,
    artist: "Example Artist",
    album: "Example Album",
    nowPlaying: false as const,
    date: "2026-11-13T16:38:00.000Z",
  })),
];

const topTracks: Array<TopTrack> = [
  { name: "Lost Chapter", artist: "Pentakill", rank: 1, playcount: 290 },
];
const topArtists: Array<TopArtist> = [{ name: "Radiohead", rank: 1, playcount: 100 }];
const topAlbums: Array<TopAlbum> = [
  { name: "Currents", artist: "Tame Impala", rank: 1, playcount: 1200 },
];

type LastfmMethod =
  | "user.getInfo"
  | "user.getTopTracks"
  | "user.getTopAlbums"
  | "user.getTopArtists"
  | "user.getRecentTracks";

function lastfm(
  before: (method: LastfmMethod) => void | Promise<void> = () => {},
  tracks: Array<RecentTrack> = [],
  topTracksByRank: Array<TopTrack> = [],
  topArtistsByRank: Array<TopArtist> = [],
  topAlbumsByRank: Array<TopAlbum> = [],
) {
  const music = serverFns["src/routes/music.{-$breakdown}/-query.ts"];
  return [
    mockServerFn(music.getUserDataFn, async () => {
      await before("user.getInfo");
      return { user };
    }),
    mockServerFn(music.getTopTracksFn, async () => {
      await before("user.getTopTracks");
      return { toptracks: { track: topTracksByRank } };
    }),
    mockServerFn(music.getTopArtistsFn, async () => {
      await before("user.getTopArtists");
      return { topartists: { artist: topArtistsByRank } };
    }),
    mockServerFn(music.getTopAlbumsFn, async () => {
      await before("user.getTopAlbums");
      return { topalbums: { album: topAlbumsByRank } };
    }),
    mockServerFn(music.getRecentTracksFn, async () => {
      await before("user.getRecentTracks");
      return { recenttracks: { track: tracks } };
    }),
  ];
}

function mockedArtwork<T extends { lastfmArtworkUrl?: string }>(
  item: T,
  imageUrl?: string,
  lastfmImageUrl?: string,
) {
  if (item.lastfmArtworkUrl) {
    return { ...item, artwork: { imageUrl: lastfmImageUrl ?? item.lastfmArtworkUrl } };
  }
  if (imageUrl) {
    return {
      ...item,
      artwork: { imageUrl },
    };
  }
  return item;
}

function musicArtwork(
  before: (data: Parameters<typeof getMusicArtwork>[0]) => void | Promise<void> = () => {},
  imageUrl?: string,
  lastfmImageUrl?: string,
) {
  const music = serverFns["src/routes/music.{-$breakdown}/-query.ts"];
  return mockServerFn(music.getMusicArtworkFn, async (data) => {
    await before(data);
    return {
      tracks: data.tracks.map((track) => mockedArtwork(track, imageUrl, lastfmImageUrl)),
      albums: data.albums.map((album) => mockedArtwork(album, imageUrl, lastfmImageUrl)),
      artists: data.artists.map((artist) => mockedArtwork(artist, imageUrl, lastfmImageUrl)),
      retryAfterMs: undefined,
    };
  });
}

function failure(): never {
  throw new Error("Service unavailable");
}

const isSummary = (method: string) => method === "user.getInfo";

test.beforeEach(async ({ network, page, home }) => {
  network.use(...lastfm(), musicArtwork());
  // Music data requests only reach the browser network fixture during client-side
  // navigation, so let the home page finish loading before following links.
  await home.goto({ waitUntil: "networkidle" });
  await page.clock.install();
});

test("shows music controls before independent requests finish", async ({ network, music }) => {
  using summary = disposablePromise();
  using rankings = disposablePromise();
  network.use(
    ...lastfm(async (method) => {
      await (isSummary(method) ? summary.promise : rankings.promise);
    }),
  );

  await music.navigate();
  await expect(music.tabs).toBeVisible();
  await expect(music.topMusic.periods).toBeVisible();
  await expect(music.topMusic.tabs).toBeVisible();
  await expect(music.summaryLoading).toBeVisible();
  await expect(music.topMusic.loading).toBeVisible();

  rankings.resolve();
  await expect(music.topMusic.topTracks).toBeVisible();
  await expect(music.summaryLoading).toBeVisible();

  summary.resolve();
  await expect(music.summary).toBeVisible();
  await expect(music.progressbars).not.toBeVisible();
});

test("waits for artwork and palettes before revealing music lists", async ({ network, music }) => {
  using topArtworkPending = disposablePromise();
  using recentArtworkPending = disposablePromise();
  using topArtworkStarted = disposablePromise();
  using recentArtworkStarted = disposablePromise();
  const imageData = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const fallbackImageUrl = `${imageData}#lastfm`;
  const imageUrl = `${imageData}#spotify`;
  const recentTracksWithFallback = recentTracksWithNowPlaying.map((track, index) =>
    index === 0 ? { ...track, lastfmArtworkUrl: fallbackImageUrl } : track,
  );
  let artworkRequests = 0;
  network.use(
    ...lastfm(undefined, recentTracksWithFallback, topTracks, topArtists),
    musicArtwork(async ({ tracks }) => {
      artworkRequests++;
      if (tracks.some(({ name }) => name === "Lost Chapter")) {
        topArtworkStarted.resolve();
        await topArtworkPending.promise;
      } else if (tracks.some(({ name }) => name === "Let It Happen")) {
        recentArtworkStarted.resolve();
        await recentArtworkPending.promise;
      }
    }, imageUrl),
  );

  await music.navigate();
  await topArtworkStarted.promise;
  await expect(music.summary).toBeVisible();
  await expect(music.tabs).toBeVisible();
  await expect(music.topMusic.periods).toBeVisible();
  await expect(music.topMusic.loading).toBeVisible();
  await expect(music.topMusic.track("Lost Chapter")).not.toBeVisible();
  await expect(music.topMusic.artist("Radiohead")).not.toBeVisible();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).not.toBeVisible();
  topArtworkPending.resolve();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  await music.topMusic.artists.select();
  await expect(music.topMusic.artworkImage("Radiohead", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );

  await music.recent.select();
  await recentArtworkStarted.promise;
  await expect(music.recent.loading).toBeVisible();
  await expect(music.recent.track("Let It Happen")).not.toBeVisible();
  await expect(music.recent.artworkImage("Let It Happen", fallbackImageUrl)).not.toBeVisible();
  await expect(music.recent.artworkImage("Let It Happen", imageUrl)).not.toBeVisible();

  recentArtworkPending.resolve();
  await expect(music.recent.artworkImage("Recent Track 2", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  await expect(music.recent.artworkImage("Let It Happen", fallbackImageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );

  await music.topMusic.select();
  await music.topMusic.tracks.select();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  await expect(music.topMusic.loading).not.toBeVisible();
  expect(artworkRequests).toBe(3);
});

test("renders Last.fm artwork returned by background enrichment", async ({ network, music }) => {
  const lastfmArtworkUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/lastfm-fallback.gif";
  const imageUrl = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  network.use(
    ...lastfm(undefined, [
      {
        name: "Let It Happen",
        artist: "Tame Impala",
        album: "Currents",
        nowPlaying: true,
        lastfmArtworkUrl,
      },
    ]),
    musicArtwork(() => {}, undefined, imageUrl),
  );

  await music.navigate();
  await music.recent.select();
  await expect(music.recent.track("Let It Happen")).toBeVisible();
  await expect(music.recent.artworkImage("Let It Happen", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
});

test("prefetches only the selected ranking and artwork and reuses visited tabs", async ({
  network,
  music,
}) => {
  const imageUrl = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const musicFns = serverFns["src/routes/music.{-$breakdown}/-query.ts"];
  const methods: Array<LastfmMethod> = [];
  const requests: Array<{ tracks: Array<string>; albums: Array<string>; artists: Array<string> }> =
    [];
  network.use(
    ...lastfm(
      (method) => {
        methods.push(method);
      },
      recentTracks,
      topTracks,
      topArtists,
      topAlbums,
    ),
    mockServerFn(musicFns.getMusicArtworkFn, (data) => {
      requests.push({
        tracks: data.tracks.map(({ name }) => name),
        albums: data.albums.map(({ name }) => name),
        artists: data.artists.map(({ name }) => name),
      });
      return {
        tracks: data.tracks.map((track) => ({ ...track, artwork: { imageUrl } })),
        albums: data.albums.map((album) => ({ ...album, artwork: { imageUrl } })),
        artists: data.artists.map((artist) => ({ ...artist, artwork: { imageUrl } })),
        retryAfterMs: undefined,
      };
    }),
  );
  await music.navigate();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(methods.toSorted()).toEqual(["user.getInfo", "user.getTopTracks"]);
  expect(requests).toEqual([{ tracks: ["Lost Chapter"], albums: [], artists: [] }]);
  await music.topMusic.albums.select();
  await expect(music.topMusic.artworkImage("Currents", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(methods.toSorted()).toEqual(["user.getInfo", "user.getTopAlbums", "user.getTopTracks"]);
  expect(requests).toEqual([
    { tracks: ["Lost Chapter"], albums: [], artists: [] },
    { tracks: [], albums: ["Currents"], artists: [] },
  ]);
  await music.topMusic.artists.select();
  await expect(music.topMusic.artworkImage("Radiohead", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(methods.toSorted()).toEqual([
    "user.getInfo",
    "user.getTopAlbums",
    "user.getTopArtists",
    "user.getTopTracks",
  ]);
  expect(requests).toEqual([
    { tracks: ["Lost Chapter"], albums: [], artists: [] },
    { tracks: [], albums: ["Currents"], artists: [] },
    { tracks: [], albums: [], artists: ["Radiohead"] },
  ]);
  await music.topMusic.tracks.select();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(requests).toHaveLength(3);
  await music.topMusic.albums.select();
  await expect(music.topMusic.album("Currents")).toBeVisible();
  expect(requests).toHaveLength(3);
  await music.recent.select();
  await expect(music.recent.artworkImage("Let It Happen", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(requests).toEqual([
    { tracks: ["Lost Chapter"], albums: [], artists: [] },
    { tracks: [], albums: ["Currents"], artists: [] },
    { tracks: [], albums: [], artists: ["Radiohead"] },
    { tracks: ["Let It Happen"], albums: [], artists: [] },
  ]);
});

test("secondary tabs reuse loaded rankings and preserve the selection when changing period", async ({
  network,
  music,
  page,
}) => {
  let artworkRequests = 0;
  const methods: Array<LastfmMethod> = [];
  network.use(
    ...lastfm(
      (method) => {
        methods.push(method);
      },
      [],
      topTracks,
      topArtists,
      topAlbums,
    ),
    musicArtwork(() => {
      artworkRequests++;
    }),
  );
  await music.navigate();
  await expect(music.topMusic.track("Lost Chapter")).toBeVisible();
  await expect(music.topMusic.artist("Radiohead")).not.toBeVisible();
  await music.topMusic.tracks.tabLink.focus();
  await music.topMusic.tracks.tabLink.press("ArrowRight");
  await expect(music.topMusic.albums.tabLink).toBeFocused();
  await expect(music.topMusic.track("Lost Chapter")).toBeVisible();
  await music.topMusic.albums.tabLink.press("Enter");
  await expect(page).toHaveURL(/type=albums/);
  await expect(music.topMusic.album("Currents")).toBeVisible();
  await expect(music.topMusic.track("Lost Chapter")).not.toBeVisible();
  expect(artworkRequests).toBe(2);

  await music.topMusic.period("7 days").click();
  await expect(music.topMusic.album("Currents")).toBeVisible();
  await expect(music.topMusic.albums.tabLink).toHaveAttribute("aria-selected", "true");
  await expect(music.topMusic.track("Lost Chapter")).not.toBeVisible();
  await expect(music.topMusic.period("7 days")).toHaveAttribute("aria-current", "page");
  expect(methods.filter((method) => method === "user.getTopTracks")).toHaveLength(1);
  expect(methods.filter((method) => method === "user.getTopAlbums")).toHaveLength(2);
  expect(methods.filter((method) => method === "user.getTopArtists")).toHaveLength(0);
  expect(artworkRequests).toBe(2);
  await music.recent.select();
  await music.topMusic.select();
  await expect(music.topMusic.album("Currents")).toBeVisible();
  await expect(music.topMusic.period("7 days")).toHaveAttribute("aria-current", "page");
});

test("retries incomplete artwork after its cooldown without refetching early on tab changes", async ({
  network,
  music,
  page,
}) => {
  const imageUrl = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const musicFns = serverFns["src/routes/music.{-$breakdown}/-query.ts"];
  let artworkRequests = 0;
  network.use(
    ...lastfm(undefined, [], topTracks, topArtists),
    mockServerFn(musicFns.getMusicArtworkFn, async (data) => {
      artworkRequests++;
      const artworkUrl = artworkRequests === 1 ? undefined : imageUrl;
      return {
        tracks: data.tracks.map((track) => mockedArtwork(track, artworkUrl)),
        albums: data.albums.map((album) => mockedArtwork(album, artworkUrl)),
        artists: data.artists.map((artist) => mockedArtwork(artist, artworkUrl)),
        retryAfterMs: artworkRequests === 1 ? 30_000 : undefined,
      };
    }),
  );

  await music.navigate();
  await expect(music.topMusic.track("Lost Chapter")).toBeVisible();
  await expect.poll(() => artworkRequests).toBe(1);

  await page.clock.fastForward(20_000);
  await music.recent.select();
  await music.topMusic.select();
  expect(artworkRequests).toBe(1);

  await page.clock.fastForward(10_000);
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  await music.topMusic.artists.select();
  await expect(music.topMusic.artworkImage("Radiohead", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(artworkRequests).toBe(3);

  await page.clock.fastForward(30_000);
  expect(artworkRequests).toBe(3);
});

test("artwork POST failures preserve music data and retry enrichment after the cooldown", async ({
  network,
  music,
  page,
}) => {
  // The network fixture skips static asset extensions before matching handlers.
  const lastfmArtworkUrl = "https://lastfm.freetls.fastly.net/i/u/300x300/available-cover";
  const imageData = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const recoveredImageUrl = `data:image/gif;base64,${imageData}`;
  const musicFns = serverFns["src/routes/music.{-$breakdown}/-query.ts"];
  let artworkRequests = 0;
  network.use(
    ...lastfm(
      undefined,
      [],
      topTracks.map((track) => ({ ...track, lastfmArtworkUrl })),
      topArtists,
    ),
    http.get(lastfmArtworkUrl, () =>
      HttpResponse.redirect(new URL("/favicon.png", page.url()).href),
    ),
    mockServerFn(musicFns.getMusicArtworkFn, (data) => {
      artworkRequests++;
      if (artworkRequests === 1) return HttpResponse.text("Service unavailable", { status: 503 });
      return {
        tracks: data.tracks.map((track) =>
          mockedArtwork(track, recoveredImageUrl, recoveredImageUrl),
        ),
        albums: data.albums.map((album) =>
          mockedArtwork(album, recoveredImageUrl, recoveredImageUrl),
        ),
        artists: data.artists.map((artist) => mockedArtwork(artist, recoveredImageUrl)),
        retryAfterMs: undefined,
      };
    }),
  );
  await music.navigate();
  await expect(music.topMusic.track("Lost Chapter")).toBeVisible();
  await expect(music.topMusic.artworkImage("Lost Chapter", lastfmArtworkUrl)).toHaveJSProperty(
    "naturalWidth",
    64,
  );
  await expect(music.alerts).not.toBeVisible();
  expect(artworkRequests).toBe(1);
  await page.clock.fastForward(20_000);
  await music.recent.select();
  await music.topMusic.select();
  expect(artworkRequests).toBe(1);

  await page.clock.fastForward(10_000);
  await expect(music.topMusic.artworkImage("Lost Chapter", recoveredImageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(artworkRequests).toBe(2);
});

test("period and tab changes show loading feedback without hiding music controls", async ({
  network,
  music,
}) => {
  await music.navigate();
  await expect(music.topMusic.topTracks).toBeVisible();

  using pending = disposablePromise();
  network.use(
    ...lastfm(async () => {
      await pending.promise;
    }),
  );
  await music.topMusic.period("7 days").click();
  await expect(music.topMusic.loading).toBeVisible();
  await expect(music.topMusic.period("7 days")).toHaveAttribute("aria-current", "page");
  await expect(music.summary).toBeVisible();

  await music.recent.select();
  await expect(music.recent.loading).toBeVisible();
  await expect(music.tabs).toBeVisible();

  pending.resolve();
  await expect(music.recent.emptyState).toBeVisible();
});

test("failed summary requests leave rankings usable and can be retried", async ({
  network,
  page,
  music,
}) => {
  network.use(
    ...lastfm((method) => {
      if (isSummary(method)) failure();
    }),
  );

  await music.navigate();
  await skipRetryBackoff(page, music.summaryError);
  await expect(music.topMusic.topTracks).toBeVisible();
  await expect(music.tabs).toBeVisible();

  using pending = disposablePromise();
  network.use(
    ...lastfm(async () => {
      await pending.promise;
    }),
  );
  await music.summaryRetry.click();
  await expect(music.summaryLoading).toBeVisible();

  pending.resolve();
  await expect(music.summary).toBeVisible();
  await expect(music.alerts).not.toBeVisible();
});

test("failed rankings preserve summary and retry without showing empty listening history", async ({
  network,
  page,
  music,
}) => {
  network.use(
    ...lastfm((method) => {
      if (!isSummary(method)) failure();
    }),
  );

  await music.navigate();
  await skipRetryBackoff(page, music.topMusic.error);
  await expect(music.summary).toBeVisible();
  await expect(music.topMusic.emptyState.first()).not.toBeVisible();

  await music.topMusic.retry.click();
  await skipRetryBackoff(page, music.topMusic.error);

  network.use(...lastfm());
  await music.topMusic.retry.click();
  await expect(music.topMusic.topTracks).toBeVisible();
  await music.topMusic.artists.select();
  await expect(music.topMusic.topArtists).toBeVisible();
});

test("changing period or tab recovers the active tab after an error", async ({
  network,
  page,
  music,
}) => {
  network.use(
    ...lastfm((method) => {
      if (!isSummary(method)) failure();
    }),
  );

  await music.navigate();
  await skipRetryBackoff(page, music.topMusic.error);

  network.use(...lastfm());
  await music.topMusic.artists.select();
  await expect(music.topMusic.topArtists).toBeVisible();
  await music.topMusic.period("7 days").click();
  await expect(music.topMusic.topArtists).toBeVisible();

  network.use(...lastfm(failure));
  await music.recent.select();
  await skipRetryBackoff(page, music.recent.error);

  await music.topMusic.select();
  await expect(music.topMusic.topArtists).toBeVisible();
  await expect(music.alerts).not.toBeVisible();
});

test("simultaneous failures show independent retry controls", async ({ network, page, music }) => {
  network.use(...lastfm(failure));

  await music.navigate();
  await skipRetryBackoff(page, music.summaryError);
  await skipRetryBackoff(page, music.topMusic.error);
  await expect.poll(() => music.retryButtons.count()).toBe(2);
  await expect(music.topMusic.periods).toBeVisible();
});

test("failed recent-track refresh keeps cached tracks and retries in place", async ({
  network,
  page,
  music,
}) => {
  network.use(...lastfm(undefined, recentTracks));

  await music.navigate();
  await music.recent.select();
  await expect(music.recent.track("Let It Happen")).toBeVisible();

  network.use(...lastfm(failure));
  // Recent tracks refresh every minute.
  await page.clock.fastForward("01:00");
  await skipRetryBackoff(page, music.recent.refreshNotice);
  await expect(music.recent.track("Let It Happen")).toBeVisible();
  await expect(music.alerts).not.toBeVisible();

  using pending = disposablePromise();
  network.use(
    ...lastfm(async () => {
      await pending.promise;
    }),
  );
  await music.recent.refreshRetry.click();
  await expect(music.recent.refreshRetry).toHaveAttribute("aria-busy", "true");
  await expect(music.recent.refreshRetry).toHaveAttribute("aria-disabled", "true");
  await expect(music.recent.track("Let It Happen")).toBeVisible();

  pending.resolve();
  await expect(music.recent.refreshNotice).not.toBeVisible();
  await expect(music.recent.emptyState).toBeVisible();
});
