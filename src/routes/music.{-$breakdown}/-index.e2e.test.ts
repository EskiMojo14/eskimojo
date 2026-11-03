import { http, HttpResponse, passthrough } from "msw";
import type { Locator, Page } from "playwright";
import { fromJSON, toCrossJSONAsync } from "seroval";
import * as v from "valibot";

import { HomePage } from "#/routes/_home/-index.e2e.model";
import { createTest, expect } from "#test/e2e";

import { MusicPage } from "./-index.e2e.model";

const test = createTest({ home: HomePage, music: MusicPage });

/** A promise resolved manually, or on disposal so waiting handlers can finish. */
function deferred() {
  const p = Promise.withResolvers<void>();
  return { ...p, [Symbol.dispose]: () => p.resolve() };
}

/** Fast-forwards through React Query's retry backoff until `locator` is visible. */
async function skipRetryBackoff(page: Page, locator: Locator) {
  await expect
    .poll(async () => {
      await page.clock.fastForward("00:05");
      return locator.isVisible();
    })
    .toBe(true);
}

const lastfmRequestSchema = v.object({
  data: v.object({ method: v.string() }),
});

const response = {
  result: {
    user: {
      playcount: "100",
      artist_count: "10",
      album_count: "20",
      track_count: "30",
      registered: { unixtime: "1506038400" },
    },
    toptracks: { track: [] },
    topartists: { artist: [] },
    recenttracks: { track: [] },
  },
};

const recentResponse = {
  result: {
    ...response.result,
    recenttracks: {
      track: [
        {
          name: "Let It Happen",
          artist: { "#text": "Tame Impala" },
          album: { "#text": "Currents" },
          image: [],
          "@attr": { nowplaying: "true" },
        },
      ],
    },
  },
};

type LastfmResolver = (method: string) => Response | Promise<Response>;

function lastfm(resolver: LastfmResolver) {
  return http.get("*/_serverFn/*", ({ request }) => {
    const payload = new URL(request.url).searchParams.get("payload");
    const parsed = payload && v.safeParse(lastfmRequestSchema, fromJSON(JSON.parse(payload)));
    if (!parsed || !parsed.success) return passthrough();
    return resolver(parsed.output.data.method);
  });
}

async function success(body: unknown = response) {
  return HttpResponse.json(await toCrossJSONAsync(body), {
    headers: { "x-tss-serialized": "true" },
  });
}

async function failure() {
  return HttpResponse.json(await toCrossJSONAsync({ error: new Error("Service unavailable") }), {
    status: 503,
    headers: { "x-tss-serialized": "true" },
  });
}

const isSummary = (method: string) => method === "user.getInfo";

test.beforeEach(async ({ network, page, home }) => {
  network.use(lastfm(() => success()));
  // Music data requests only reach the browser network fixture during client-side
  // navigation, so let the home page finish loading before following links.
  await home.goto({ waitUntil: "networkidle" });
  await page.clock.install();
});

test("shows music controls before independent requests finish", async ({ network, music }) => {
  using summary = deferred();
  using rankings = deferred();
  network.use(
    lastfm(async (method) => {
      await (isSummary(method) ? summary.promise : rankings.promise);
      return success();
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

  using pending = deferred();
  network.use(
    lastfm(async () => {
      await pending.promise;
      return success();
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
  network.use(lastfm((method) => (isSummary(method) ? failure() : success())));

  await music.navigate();
  await skipRetryBackoff(page, music.summaryError);
  await expect(music.topMusic.topTracks).toBeVisible();
  await expect(music.tabs).toBeVisible();

  using pending = deferred();
  network.use(
    lastfm(async () => {
      await pending.promise;
      return success();
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
  network.use(lastfm((method) => (isSummary(method) ? success() : failure())));

  await music.navigate();
  await skipRetryBackoff(page, music.topMusic.error);
  await expect(music.summary).toBeVisible();
  await expect(music.topMusic.emptyState.first()).not.toBeVisible();

  await music.topMusic.retry.click();
  await skipRetryBackoff(page, music.topMusic.error);

  network.use(lastfm(() => success()));
  await music.topMusic.retry.click();
  await expect(music.topMusic.topTracks).toBeVisible();
  await expect(music.topMusic.topArtists).toBeVisible();
});

test("changing period or tab recovers the active tab after an error", async ({
  network,
  page,
  music,
}) => {
  network.use(lastfm((method) => (isSummary(method) ? success() : failure())));

  await music.navigate();
  await skipRetryBackoff(page, music.topMusic.error);

  network.use(lastfm(() => success()));
  await music.topMusic.period("7 days").click();
  await expect(music.topMusic.topTracks).toBeVisible();

  network.use(lastfm(() => failure()));
  await music.recent.select();
  await skipRetryBackoff(page, music.recent.error);

  await music.topMusic.select();
  await expect(music.topMusic.topTracks).toBeVisible();
  await expect(music.alerts).not.toBeVisible();
});

test("simultaneous failures show independent retry controls", async ({ network, page, music }) => {
  network.use(lastfm(() => failure()));

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
  network.use(lastfm(() => success(recentResponse)));

  await music.navigate();
  await music.recent.select();
  await expect(music.recent.track("Let It Happen")).toBeVisible();

  network.use(lastfm(() => failure()));
  // Recent tracks refresh every minute.
  await page.clock.fastForward("01:00");
  await skipRetryBackoff(page, music.recent.refreshNotice);
  await expect(music.recent.track("Let It Happen")).toBeVisible();
  await expect(music.alerts).not.toBeVisible();

  using pending = deferred();
  network.use(
    lastfm(async () => {
      await pending.promise;
      return success();
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
