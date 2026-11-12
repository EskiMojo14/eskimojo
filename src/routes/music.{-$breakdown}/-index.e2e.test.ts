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
    image: {},
    nowPlaying: true,
  },
];

type LastfmMethod =
  | "user.getInfo"
  | "user.getTopTracks"
  | "user.getTopArtists"
  | "user.getRecentTracks";

function lastfm(
  before: (method: LastfmMethod) => void | Promise<void> = () => {},
  tracks: Array<RecentTrack> = [],
) {
  const music = serverFns["src/routes/music.{-$breakdown}/-query.ts"];
  const topTracks: Array<TopTrack> = [];
  const topArtists: Array<TopArtist> = [];
  return [
    mockServerFn(music.getUserDataFn, async () => {
      await before("user.getInfo");
      return { user };
    }),
    mockServerFn(music.getTopTracksFn, async () => {
      await before("user.getTopTracks");
      return { toptracks: { track: topTracks } };
    }),
    mockServerFn(music.getTopArtistsFn, async () => {
      await before("user.getTopArtists");
      return { topartists: { artist: topArtists } };
    }),
    mockServerFn(music.getRecentTracksFn, async () => {
      await before("user.getRecentTracks");
      return { recenttracks: { track: tracks } };
    }),
  ];
}

function failure(): never {
  throw new Error("Service unavailable");
}

const isSummary = (method: string) => method === "user.getInfo";

test.beforeEach(async ({ network, page, home }) => {
  network.use(...lastfm());
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
