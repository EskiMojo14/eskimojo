import type { Locator, Page } from "playwright";

import { HomePage } from "#/routes/_home/-index.e2e.model";
import { disposablePromise } from "#/utils";
import { createTest, expect } from "#test/e2e";
import { mockServerFn } from "#test/e2e/msw";
import { serverFns } from "#test/e2e/server-fns.gen";

import { MusicPage } from "./-index.e2e.model";
import type { RecentTrack, TopArtist, TopTrack, UserData } from "./-query";

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

type LastfmMethod =
  | "user.getInfo"
  | "user.getTopTracks"
  | "user.getTopArtists"
  | "user.getRecentTracks";

function lastfm(
  before: (method: LastfmMethod) => void | Promise<void> = () => {},
  tracks: Array<RecentTrack> = [],
  topTracksByRank: Array<TopTrack> = [],
  topArtistsByRank: Array<TopArtist> = [],
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
    mockServerFn(music.getRecentTracksFn, async () => {
      await before("user.getRecentTracks");
      return { recenttracks: { track: tracks } };
    }),
  ];
}

function mockedArtwork<T extends { lastfmArtworkUrl?: string }>(
  item: T,
  type: "track" | "artist",
  imageUrl?: string,
  lastfmImageUrl?: string,
) {
  if (imageUrl) {
    return {
      ...item,
      artwork: {
        imageUrl,
        spotifyUrl: `https://open.spotify.com/${type}/test`,
      },
    };
  }
  if (item.lastfmArtworkUrl) {
    return { ...item, artwork: { imageUrl: lastfmImageUrl ?? item.lastfmArtworkUrl } };
  }
  return item;
}

function spotifyArtwork(
  before: () => void | Promise<void> = () => {},
  imageUrl?: string,
  lastfmImageUrl?: string,
) {
  const music = serverFns["src/routes/music.{-$breakdown}/-query.ts"];
  return mockServerFn(music.getMusicArtworkFn, async (data) => {
    await before();
    return {
      tracks: data.tracks.map((track) => mockedArtwork(track, "track", imageUrl, lastfmImageUrl)),
      artists: data.artists.map((artist) =>
        mockedArtwork(artist, "artist", imageUrl, lastfmImageUrl),
      ),
      retryAfterMs: undefined,
    };
  });
}

function failure(): never {
  throw new Error("Service unavailable");
}

const isSummary = (method: string) => method === "user.getInfo";

test.beforeEach(async ({ network, page, home }) => {
  network.use(...lastfm(), spotifyArtwork());
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
  await expect(music.summaryLoading).toBeVisible();
  await expect(music.topMusic.loading).toBeVisible();

  rankings.resolve();
  await expect(music.topMusic.topTracks).toBeVisible();
  await expect(music.summaryLoading).toBeVisible();

  summary.resolve();
  await expect(music.summary).toBeVisible();
  await expect(music.progressbars).not.toBeVisible();
});

test("shows Last.fm results while Spotify artwork is still loading", async ({ network, music }) => {
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
    spotifyArtwork(async () => {
      artworkRequests++;
      if (artworkRequests === 1) {
        topArtworkStarted.resolve();
        await topArtworkPending.promise;
      } else if (artworkRequests === 2) {
        recentArtworkStarted.resolve();
        await recentArtworkPending.promise;
      }
    }, imageUrl),
  );

  await music.navigate();
  await topArtworkStarted.promise;
  await expect(music.topMusic.track("Lost Chapter")).toBeVisible();
  await expect(music.topMusic.artist("Radiohead")).toBeVisible();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).not.toBeVisible();
  topArtworkPending.resolve();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  await expect(music.topMusic.artworkImage("Radiohead", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );

  await music.recent.select();
  await recentArtworkStarted.promise;
  await expect(music.recent.track("Let It Happen")).toBeVisible();
  await expect(music.recent.artworkImage("Let It Happen", fallbackImageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  await expect(music.recent.artworkImage("Let It Happen", imageUrl)).not.toBeVisible();

  recentArtworkPending.resolve();
  await expect(music.recent.artworkImage("Let It Happen", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );

  await music.topMusic.select();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(artworkRequests).toBe(2);
});

test("uses Last.fm artwork when Spotify has no matching image", async ({ network, music }) => {
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
    spotifyArtwork(() => {}, undefined, imageUrl),
  );

  await music.navigate();
  await music.recent.select();
  await expect(music.recent.track("Let It Happen")).toBeVisible();
  await expect(music.recent.artworkImage("Let It Happen", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
});

test("passes release and recording MBIDs through prefetch and renders non-Spotify artwork", async ({
  network,
  music,
}) => {
  const recordingMbid = "b1a9c0e9-d987-4042-ae91-78d6a3267d69";
  const releaseMbid = "76df3287-6cda-33eb-8e9a-044b5e15ffdd";
  const imageUrl = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const musicFns = serverFns["src/routes/music.{-$breakdown}/-query.ts"];
  let requests = 0;
  network.use(
    ...lastfm(
      undefined,
      recentTracks.map((track) => ({ ...track, recordingMbid, releaseMbid })),
      topTracks.map((track) => ({ ...track, recordingMbid })),
      topArtists,
    ),
    mockServerFn(musicFns.getMusicArtworkFn, (data) => {
      requests++;
      expect(data.tracks[0]?.recordingMbid).toBe(recordingMbid);
      if (data.tracks[0]?.name === "Let It Happen") {
        expect(data.tracks[0].releaseMbid).toBe(releaseMbid);
      }
      return {
        tracks: data.tracks.map((track) => ({ ...track, artwork: { imageUrl } })),
        artists: data.artists,
        retryAfterMs: undefined,
      };
    }),
  );
  await music.navigate();
  await expect(music.topMusic.artworkImage("Lost Chapter", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  await music.recent.select();
  await expect(music.recent.artworkImage("Let It Happen", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(requests).toBe(2);
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
        tracks: data.tracks.map((track) => mockedArtwork(track, "track", artworkUrl)),
        artists: data.artists.map((artist) => mockedArtwork(artist, "artist", artworkUrl)),
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
  await expect(music.topMusic.artworkImage("Radiohead", imageUrl)).toHaveJSProperty(
    "naturalWidth",
    1,
  );
  expect(artworkRequests).toBe(2);

  await page.clock.fastForward(30_000);
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
  await music.topMusic.period("7 days").click();
  await expect(music.topMusic.topTracks).toBeVisible();

  network.use(...lastfm(failure));
  await music.recent.select();
  await skipRetryBackoff(page, music.recent.error);

  await music.topMusic.select();
  await expect(music.topMusic.topTracks).toBeVisible();
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
